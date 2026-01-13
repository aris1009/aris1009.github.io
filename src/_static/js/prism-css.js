/* PrismJS CSS Language Bundle */
(function (Prism) {
  Prism.languages.css = {
    'comment': /\/\*[\s\S]*?\*\//,
    'atrule': {
      pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{])[^;{])*(?:;|(?=\s*\{))/,
      inside: {
        'rule': /^@[\w-]+/,
        'selector-function-argument': {
          pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
          lookbehind: true,
          alias: 'selector'
        },
        'keyword': {
          pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
          lookbehind: true
        }
        // See rest below
      }
    },
    'url': {
      // https://drafts.csswg.org/css-values-3/#urls
      pattern: RegExp('\\burl\\((?:' + /[^"'(),\s]/.source + '|' + /["']/.source + /(?:[^"'\\\r\n]|\\(?:[^\r\n]|\r?\n|\r\n?))*/.source + /["']/.source + ')\\)',
      'i'),
      greedy: true,
      inside: {
        'function': /^url/i,
        'punctuation': /^\(|\)$/,
        'string': {
          pattern: RegExp(/^["'][\s\S]+["']$/),
          alias: 'url'
        }
      }
    },
    'selector': {
      pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + /["']/.source + /(?:[^"'\\\r\n]|\\(?:[^\r\n]|\r?\n|\r\n?))*/.source + /["']/.source + ')*(?=\\s*\\{)'),
      lookbehind: true
    },
    'string': {
      pattern: RegExp(/^(["'])(?:[^"'\\\r\n]|\\(?:[^\r\n]|\r?\n|\r\n?))*\1/),
      greedy: true
    },
    'property': {
      pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
      lookbehind: true
    },
    'important': /!important\b/i,
    'function': {
      pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
      lookbehind: true
    },
    'punctuation': /[(){},;]/
  };

  Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

  var interpolation = Prism.languages.css.selector.inside.interpolation = {
    pattern: /\{[^}]+\}/,
    greedy: true,
    inside: Prism.languages.css
  };

  Prism.languages.css.selector.inside.interpolation = interpolation;

  var string = Prism.languages.css.string.inside = {
    'url-link': {
      pattern: /\burl\((["']?).*?\1\)/i,
      greedy: true,
      inside: {
        'function': /^url/i,
        'punctuation': /^\(|\)$/,
        'string': {
          pattern: /["'][\s\S]+["']/,
          alias: 'url'
        }
      }
    },
    'interpolation-punctuation': {
      pattern: /^\{|\}$/,
      alias: 'punctuation'
    },
    'interpolation': interpolation
  };

  Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

}(Prism));