---
layout: article.njk
title: "How Git Rebase Interactive Reorders Commits"
description: "git rebase -i doesn't compute a combined diff. It replays each commit sequentially using cherry-pick machinery, and knowing that explains every conflict you'll ever encounter."
date: 2026-04-29
keyword: git rebase -i internals, git sequencer, cherry-pick three-way merge, rebase conflict reorder
difficulty: intermediate
contentType: deep-dive
technologies: ['Git']
type: article
locale: en-us
permalink: /blog/en-us/how-git-rebase-interactive-reorders-commits/
tags:
  - git
  - git-internals
  - rebase
  - cherry-pick
  - three-way-merge
  - sequencer
  - developer-tools
  - intermediate
  - deep-dive
---

> **TL;DR:** `git rebase -i` writes a todo list to `.git/rebase-merge/git-rebase-todo`, then the *sequencer* processes it one line at a time. Each `pick` is a {% dictionaryLink "cherry-pick", "cherry-pick" %}: a {% dictionaryLink "three-way merge", "three-way-merge" %}, not a text-patch application. There is no global optimization across the reordered set. Reordering commits with mutual dependencies causes conflicts· reordering independent commits does not. That is the whole model.

## The question every power user eventually asks

You drag two commit lines in `git rebase -i`, save the file, and watch Git either sail through cleanly or erupt into conflicts. If you've used interactive rebase long enough, you've wondered what exactly happens during those seconds between saving the todo list and the result appearing in your terminal.

The common mental model is fuzzy at best. Some people imagine Git computing a single combined patch across all the reordered commits and applying it at once. Others assume some graph-aware optimization: that Git "figures out" the dependency order and applies changes intelligently. Neither is true.

The real mechanism is simpler and more concrete: Git processes the todo list one line at a time, replaying each commit using the same {% dictionaryLink "cherry-pick", "cherry-pick" %} machinery it uses for `git cherry-pick`. There is no global optimization. What you write in the editor is exactly what gets executed, commit by commit, in strict sequence.

This matters the moment you need to debug a conflict or predict whether a reordering will succeed.

## The todo file

When you run `git rebase -i HEAD~N`, Git collects the N commits to replay and writes them to a file: `.git/rebase-merge/git-rebase-todo`. Open your editor and you'll see something like this:

```text
pick a1b2c3d Add function foo() to utils.c
pick e4f5a6b Call foo() from main.c
pick 7c8d9e0 Refactor error handling in parser.c
```

Each line is a command word followed by an abbreviated commit hash and the commit subject. The full set of available commands is `pick`, `reword`, `edit`, `squash`, `fixup`, `drop`, `exec`, `break`, `label`, `reset`, and `merge`. Daily use mostly touches the first five or six.

When you save and exit the editor, Git has everything it needs to replay your history in the new order.

Alongside the todo file, Git writes a few more state files into `.git/rebase-merge/`:

- `head-name`: the branch being rebased
- `onto`: the target base commit
- `orig-head`: the original HEAD, used by `--abort` to restore the branch

These files make the entire operation *resumable*. When Git halts on a conflict, all of this state sits on disk, intact, waiting for `git rebase --continue`. Nothing is lost· the sequencer picks up exactly where it stopped.

## The sequencer

The orchestration engine that drives interactive rebase is the *sequencer*. Its implementation lives in `sequencer.c` in the {% externalLink "Git source tree", "https://github.com/git/git/blob/master/sequencer.c" %}, and it does exactly what the name suggests: it reads the todo file and executes each command in sequence.

The sequencer was not originally built for `git rebase -i`. It was created to power `git cherry-pick --continue`, the ability to pause a multi-commit cherry-pick on conflict, resolve it, and resume. The rebase team recognized this was the same problem: replay commits one at a time, survive conflicts, pick up from where you left off. They repurposed the sequencer to drive interactive rebase, which is why `git cherry-pick` and `git rebase --continue` have nearly identical lifecycle commands.

For each `pick` line, the sequencer calls an internal function, `do_pick_commit()`, that invokes the same code path as `git cherry-pick`. After a successful commit application, the sequencer advances to the next line. On conflict, it halts, writes conflict markers to the working tree, and exits with all state on disk, undisturbed.

This architecture also explains why `exec` lines in the todo file work: the sequencer dispatches non-pick commands natively. You can interleave shell commands between commit replays (run your test suite after each commit, for example) and the sequencer handles the scheduling without any special-casing.

## Each pick is a three-way merge

This is the part that surprises most people. When the sequencer executes a `pick`, it does not extract the commit's diff and pipe it through `patch(1)`. It does not apply a stored `.patch` file to the working tree. Instead, it performs a {% dictionaryLink "three-way merge", "three-way-merge" %}.

The merge has three participants:

```text
          BASE
  (parent of the commit being cherry-picked)
         /                    \
       OURS                 THEIRS
(current HEAD tree)   (tree of the cherry-picked commit)
```

- **Base** is the tree of the cherry-picked commit's *parent* (not the rebase `onto` commit, but the commit's parent in the *original* DAG). This is what the repository looked like just before that commit was originally made.
- **Ours** is the current HEAD, wherever we are in the rebase sequence so far.
- **Theirs** is the tree of the commit being cherry-picked, the snapshot as it existed after the original commit.

Git computes the diff from Base→Theirs (what the commit *changed*) and applies that delta on top of Ours. Functionally this is "re-applying the commit's change," but using full merge machinery instead of plain text diffing.

The practical guarantee this gives you: as long as the code region touched by the cherry-picked commit is *unmodified* in Ours relative to Base, the merge succeeds cleanly. The instant Ours has already changed the same region, because an earlier commit in the reordered list touched it, a conflict is reported.

Using merge machinery instead of `patch(1)` also handles renames, mode changes, and file moves more gracefully. But the sequential nature is unchanged: commit N in your reordered list sees the result of N-1 as its Ours, not some globally optimized intermediate state.

## Why reordering causes conflicts

Take a concrete example. Two commits on a branch:

```text
A: Add function foo() to utils.c          (line 40)
B: Call foo() from main.c; import utils.c  (depends on A)
```

In the original order `[A, B]`, replaying A then B is clean. Now reorder to `[B, A]` in the todo file:

**Replay B first.** Base = the parent of B in the original graph. Ours = the rebase `onto` commit, which does not yet have `foo()`. Theirs = B's tree. B's diff adds the `foo()` call in `main.c` and the import statement. Since Ours is the same state B's Base came from, the line regions in `main.c` are unmodified· the merge succeeds textually. Git applies B's changes to `main.c` cleanly.

**Replay A second.** A's `foo()` definition lands in `utils.c`. Again, no textual conflict.

The result compiles, but `foo()` is called before it is defined. The semantic dependency has been silently inverted, and no textual conflict surfaces to warn you.

This is the critical distinction between *textual conflicts* and *semantic conflicts*. Git's three-way merge detects textual overlaps, two commits modifying the same line range. It cannot detect semantic dependencies: function calls before definitions, config keys read before the parser that sets them, database migrations applied before the schema change that creates the table. Textual conflicts surface immediately· semantic ones only emerge at compile or test time.

This is also why `--autosquash` with fixup commits is safe only when the fixup is genuinely independent, touching no regions that other commits in the rebase range depend on.

## The merge backend vs. the apply backend

For much of Git's history, `git rebase` had two execution paths.

**The apply backend** (the default before Git 2.26) used `git format-patch` to export commits as `.patch` files, then `git am` to apply them. The `am` command internally drives `git apply`, which is essentially `patch(1)` with Git awareness. It is faster for simple linear histories but handles renames poorly and cannot reconstruct merge commits.

**The merge backend** (default since {% externalLink "Git 2.26", "https://github.com/git/git/blob/master/Documentation/RelNotes/2.26.0.adoc" %}, released March 2020) is the sequencer + cherry-pick + three-way merge path described in this post. It supports the full set of interactive rebase commands (`exec`, `label`, `reset`, `merge`) and is required for `--rebase-merges` to correctly rebuild merge commits in the rebased history.

The Git 2.26 release notes state the change plainly:

> "git rebase uses a different backend that is based on the merge machinery by default."

You can still force the apply backend with `git rebase --apply`. But the merge backend is the current default, which means everything in this post describes how `git rebase -i` has worked since March 2020.

### OID remapping and `--rebase-merges`

One detail worth knowing: as each commit is re-applied, it receives a new object ID because its parent pointer changes. The sequencer maintains an internal remap table (old hash → new hash) across the entire rebase session.

This remap table is what makes `--rebase-merges` possible. When the sequencer encounters a `merge` command in the todo list, it looks up parent object IDs through this table to reconstruct merge commits with the correct updated parent references. Without remapping, a reconstructed merge commit would point to pre-rebase parent hashes, producing a broken history.

## What this means in practice

The sequencer model has predictable implications:

| Observation | Mechanism |
|---|---|
| Reordering non-overlapping commits is always safe | Cherry-pick of non-overlapping diffs merges cleanly |
| Reordering commits touching the same line range causes a conflict | Three-way merge detects the overlap |
| `git rebase --continue` works after resolving a conflict | All sequencer state is persisted to disk |
| `git rebase --abort` restores the original branch | The `orig-head` state file is used |
| `exec` lines run shell commands between commit replays | The sequencer dispatches non-pick commands natively |
| `--rebase-merges` can preserve merge commits | The sequencer's OID remap table enables this |

There is no magic here. Just sequential cherry-picks, each a three-way merge, driven by a file on disk you can read and edit at any time.

When a rebase conflict confuses you, look at `.git/rebase-merge/git-rebase-todo` and `.git/rebase-merge/done`. They tell you exactly where in the sequence you are and what has already been applied. The sequencer's state is transparent by design.

The fact that the sequencer was originally built for multi-commit cherry-pick and repurposed for interactive rebase is not a historical accident· it reflects the conceptual identity between the two operations. If you can predict whether a `git cherry-pick` will conflict, you can predict whether a rebase reordering will conflict. The machinery is the same.

---

**Further reading:** The {% externalLink "git-rebase documentation", "https://git-scm.com/docs/git-rebase" %} covers the full set of todo commands and backend flags. For how Git stores trees and objects, the {% externalLink "Pro Git chapter on Git Internals", "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects" %} fills in the snapshot model. The sequencer implementation itself is readable in {% externalLink "sequencer.c", "https://github.com/git/git/blob/master/sequencer.c" %}· the function names `do_pick_commit`, `pick_commits`, and `sequencer_continue` map directly to the concepts in this post.
