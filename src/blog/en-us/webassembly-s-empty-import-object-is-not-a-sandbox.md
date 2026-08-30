---
layout: article.njk
title: "WebAssembly's \"Empty\" Import Object Is Not a Sandbox"
description: "Passing {} as the WebAssembly importObject exposes all of Object.prototype to the sandboxed module. Thomas Rinsma's Phrack #72 exploit converts that prototype leak into arbitrary JavaScript execution with no special opcodes. CVE-2025-68668 (CVSS 9.9) confirms the class of mistake is production-grade."
date: 2026-06-21
keywords:
  - WebAssembly sandbox escape
  - importObject prototype chain
  - CVE-2025-68668
  - n8n Pyodide vulnerability
  - WebAssembly security
  - Phrack 72 Rinsma
  - WASM sandbox bypass
  - Object.prototype inheritance
  - JavaScript sandbox escape
  - null prototype object
tags:
  - security
  - webassembly
  - javascript
  - sandbox
  - cve
  - deep-dive
difficulty: intermediate
contentType: deep-dive
technologies: ["WebAssembly", "JavaScript", "Node.js"]
type: article
locale: en-us
draft: false
permalink: /blog/en-us/webassembly-s-empty-import-object-is-not-a-sandbox/
---

If you've ever written this line in a Node.js application, you've probably assumed it was safe:

```js
const instance = await WebAssembly.instantiate(wasmBytes, {});
```

The reasoning is intuitive: you're handing the module an empty object, so it has nothing to call. No imported functions. No host capabilities. An island.

That reasoning is wrong, and the spec says exactly why. Thomas Rinsma documented the full exploit chain in {% externalLink "Phrack #72", "https://phrack.org/issues/72/10_md" %} (August 2025) and presented it at WHY2025 under the title "Escaping a misleading sandbox." {% externalLink "CVE-2025-68668", "https://nvd.nist.gov/vuln/detail/CVE-2025-68668" %} (CVSS 9.9) then confirmed the same architectural mistake had already shipped into production.

---

## TL;DR

- Passing `{}` to `WebAssembly.instantiate()` is **not** an empty interface· the spec resolves imports using `Get()`, which traverses the JavaScript prototype chain.
- `{}` inherits `Object.prototype`· every property on it, including `.constructor`, `.toString`, and `Object.groupBy`, is reachable as a WASM import.
- Rinsma's Phrack #72 exploit chains those inherited properties to obtain the `Function` constructor and execute arbitrary JavaScript from inside the "sandboxed" module.
- CVE-2025-68668 (CVSS 9.9) confirms this class of misunderstanding already caused a Critical-severity sandbox escape in n8n.
- **Fix**: use `Object.create(null)` at every level of the import object· for genuine sandboxing, use Wasmtime or WasmEdge instead of JavaScript.

---

## The import object is not a jail

The {% dictionaryLink "WebAssembly import object", "wasm-import-object" %} is the second argument you pass to `WebAssembly.instantiate()`. When a WASM module declares an import, any function or global the host must supply, the runtime resolves it by looking up a name inside this object. The natural assumption is that the import object acts as a whitelist: the module can only reach what you explicitly put there.

The {% externalLink "MDN documentation", "https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiate_static" %} for `WebAssembly.instantiate()` does not challenge this assumption. It says only that there must be a matching property for each declared import or a `LinkError` is thrown, with no mention of inheritance and no security caveat. This isn't an MDN oversight so much as a documentation gap that has quietly fed the wrong mental model into production code.

The {% externalLink "WebAssembly JavaScript Interface specification", "https://webassembly.github.io/spec/js-api/" %} tells a different story. Import resolution uses the ECMAScript abstract operation **`Get(importObject, moduleName)`**, defined in {% externalLink "ECMA-262 §7.3.3", "https://tc39.es/ecma262/#sec-get-o-p" %}. The `Get` operation does not inspect only own properties. It calls `[[Get]]`, which walks the `[[Prototype]]` chain until it finds the property or reaches `null`.

A plain object literal `{}` has `Object.prototype` as its prototype. Every property of `Object.prototype`, including `.constructor`, `.toString`, `.hasOwnProperty`, and `.valueOf`, is reachable through a standard WASM import declaration:

```js
// What you write
const instance = await WebAssembly.instantiate(wasmBytes, {});

// What the spec sees when resolving "constructor" from that importObject
Get({}, "constructor")
// → Object.prototype.constructor → Object (the constructor function itself)
```

This isn't a V8 quirk or a Node.js implementation detail. It's identical behavior across every spec-compliant engine: V8, SpiderMonkey, and JavaScriptCore all exhibit it. The prototype chain traversal is a defined consequence of how `Get()` works in ECMAScript, and the spec offers no exception for WASM contexts.

Most developers believe they passed nothing. The reality is that `{}` inherits everything on `Object.prototype`, and that inheritance cannot be avoided unless the object is explicitly created without a prototype.

---

## From `{}` to `Function` in four steps

In his {% externalLink "Phrack #72 paper", "https://phrack.org/issues/72/10_md" %} and {% externalLink "WHY2025 conference talk", "https://media.ccc.de/v/why2025-226-escaping-a-misleading-sandbox-breaking-the-webassembly-javascript-barrier" %}, Thomas Rinsma constructs a complete exploit that converts prototype leakage into arbitrary JavaScript execution. The exploit uses no exotic opcodes, no browser-specific APIs, and no exported functions, just plain WebAssembly and a plain `{}`.

The key type is {% dictionaryLink "externref", "wasm-externref" %}: WebAssembly's opaque reference to a JavaScript object. The module cannot inspect the object's fields directly, but it can pass the reference back to the host through import calls, and those calls can chain.

**Stage 1: Import the prototype properties.**

The module declares imports that resolve through the prototype chain:

```wat
(import "env" "constructor" (global externref))
```

`Get({}, "constructor")` walks `Object.prototype` and returns `Object`, the built-in constructor function. The module now holds a live JS reference to `Object` as an `externref`.

**Stage 2: Obtain `Function`.**

`Object.constructor` is `Function`. One more import declaration:

```wat
(import "env" "constructor_constructor" (global externref))
```

This resolves to `Object.constructor.constructor`, which is `Function` itself, the primitive needed to compile and execute arbitrary strings as JavaScript code.

**Stage 3: Build an arbitrary string from integers.**

WASM works natively with integers, not strings. To call `Function(codeString)`, the module needs to construct a string without relying on any string literals in its data section. This is where the exploit becomes a {% dictionaryLink "weird machine", "weird-machine" %}: Rinsma uses additional prototype-inherited built-ins, including `Object.groupBy`, `Object.getOwnPropertyDescriptors`, `.keys()`, `.values()`, and `.assign()`, to coerce integer values into string fragments and concatenate them. Every piece of this string factory is assembled from unintended computational substrates reachable through the same prototype chain traversal.

**Stage 4: Execute.**

```js
// The constructed string is compiled and invoked at the JS boundary
Function(constructedString)()
```

Arbitrary code runs in the host JavaScript context with the same privileges as the surrounding page or server process. No special permissions. No browser vulnerability. No deviation from specification behavior. The entire chain works because the spec says it should.

---

## This already happened: CVE-2025-68668

{% externalLink "n8n", "https://n8n.io" %}, a widely deployed workflow automation platform, shipped a Python Code Node backed by Pyodide, CPython compiled to WebAssembly, meant to execute untrusted user-provided Python inside a controlled environment. The sandbox was implemented at the language layer: n8n blocked specific dangerous functions and patched the Python namespace at initialization time.

The result was a Critical-severity sandbox escape. Affected versions span n8n 1.0.0 through versions prior to 2.0.0. CVSS score: **9.9**. Any authenticated user with workflow modification permissions could escape the sandbox and execute arbitrary operating system commands with n8n process privileges, effectively full server compromise.

The specific exploit paths differ from Rinsma's prototype chain technique: attackers reached ctypes FFI and Pyodide internal eval APIs that bypassed the namespace patches. But the root cause is structurally identical· function-level blocking is not capability-level isolation. The Python and WASM runtimes shared the JavaScript host's memory and process context, and that proximity was sufficient to escape regardless of which specific API the attacker chose.

The fix in n8n 2.0.0 was architectural: a task-runner-based Python sandbox with process-level isolation, rather than namespace patching in a shared runtime. The {% externalLink "GitHub security advisory", "https://github.com/n8n-io/n8n/security/advisories/GHSA-62r4-hw23-cc8v" %} (GHSA-62r4-hw23-cc8v) and the NVD entry are both public.

This isn't a historical curiosity. A production platform with enterprise users shipped exactly this class of mistake and received a near-maximum severity score for it. The pattern is common enough that Cyera Research named the exploit "N8Scape", a name that implies a category, not a one-off.

---

## Three tiers of actual mitigation

Knowing what the spec does, the fix is simple to state, subtle to get right.

### Tier 1: Null-prototype import object

```js
const importObject = Object.create(null);
importObject.env = Object.create(null);
importObject.env.logMessage = (ptr, len) => { /* safe host function */ };

const instance = await WebAssembly.instantiate(wasmBytes, importObject);
```

A {% dictionaryLink "null-prototype object", "null-prototype-object" %} has no `[[Prototype]]`. The `Get()` traversal starts and terminates immediately because there is nothing to inherit. This closes the prototype leak for the top-level import object.

The critical caveat: every namespace object assigned inside the import object must also be prototype-free. If `importObject.env = {}`, the module can import `env.constructor` and reopen the chain one level deeper. Null-prototype objects must be used consistently at every level.

### Tier 2: Deep namespace scrubbing

For import objects assembled from existing code, a sanitiser function helps:

```js
function safeNamespace(exports) {
  const ns = Object.create(null);
  for (const [key, val] of Object.entries(exports)) {
    ns[key] = val; // own enumerable properties only
  }
  return ns;
}
```

`Object.entries()` collects only own enumerable properties and ignores the prototype chain. The resulting namespace carries the same keys as the source object but no prototype. Apply this to every namespace before passing it into `WebAssembly.instantiate()`.

This is more error-prone than Tier 1. As the module's import surface grows, every new namespace is a potential gap. Tier 2 is suitable for hardening existing code· Tier 1 is the safer default for new code.

### Tier 3: Runtime-level isolation

Tiers 1 and 2 fix the import object. They do not change the fundamental architecture: a WASM module sharing the JavaScript host's heap. If you need genuine isolation, the import object is the wrong layer to trust.

{% externalLink "Wasmtime", "https://wasmtime.dev" %} and {% externalLink "WasmEdge", "https://wasmedge.org" %} are standalone runtimes that do not embed a JavaScript engine. WASM modules interact with the host through capability-based WASI interfaces. There's no `Object.prototype` to traverse because there's no JavaScript runtime. The module cannot reach host memory it was not explicitly granted a capability for.

For browser-context isolation, Web Workers with `cross-origin-isolated` headers (via COOP and COEP) or sandboxed `<iframe>` elements with `postMessage` communication create process boundaries where the host JavaScript heap is not shared with the embedded module.

---

## The mental model to carry forward

The WebAssembly specification was not designed with the import object as a security boundary. Nothing in the spec hints at this, because the spec authors were not thinking about it that way. The `Get()` operation traverses the prototype chain because that is how `Get()` works in ECMAScript, consistently and without exception for WASM contexts.

The {% externalLink "OWASP WebAssembly Security Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/WebAssembly_Security_Cheat_Sheet.html" %} frames this correctly: the JavaScript host is the attack surface, not a protective layer. Any architecture where the import object is the primary security boundary is trusting a mechanism the spec never designed for that purpose.

> **The WASM sandbox boundary is the host runtime, not the import object.**

The practical audit question for any WASM-based plugin system or sandboxed computation layer is: if a malicious module obtained a reference to `Function`, what could it do? If the answer is "run anything with my process privileges," the import object is not a sandbox boundary· it's decoration.

If you are running untrusted WASM in a JavaScript runtime (Node.js, Deno, Bun, or a browser extension), audit every call to `WebAssembly.instantiate()` and `WebAssembly.instantiateStreaming()` in your codebase. Replace `{}` with `Object.create(null)` at minimum, apply null prototypes to every nested namespace, and consider whether a dedicated WASM runtime is the right tool for your threat model.

The spec told us exactly how this works. The exploit chain confirms it. Now you know what to look for.
