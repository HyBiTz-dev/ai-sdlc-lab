---
name: code-review
description: Review code for correctness bugs, security vulnerabilities, broken edge cases, and regressions using a fleet of specialised subagents that each hunt one class of issue, followed by a verification pass that filters false positives. Use when asked to "code review", "review my changes", "review the diff", "review this branch/PR", "review the repo", or before pushing. Reports 🔴 Important / 🟡 Nit / 🟣 Pre-existing findings at file:line. A local, agent-side implementation of Claude Code's `/code-review`.
---

# Code Review

Multi-agent review of the working tree or a diff, in the shape of Claude Code's
managed Code Review but running locally in this session instead of on Anthropic
infrastructure. No GitHub App, no CI, no plan requirement.

Reference: <https://code.claude.com/docs/en/code-review>

## The shape of a review

**Correctness first.** The default target is bugs that would break production —
not formatting, not naming, not missing test coverage. Style findings are allowed
only when `REVIEW.md` asks for them.

Three properties make the output worth reading:

1. **Specialised hunters.** Each subagent looks at the code through one lens
   (logic, security, edge cases, framework misuse, regressions). A single pass
   finds the loudest bug; a fleet finds the quiet one.
2. **A verification pass.** Every candidate finding is checked against the
   actual code before it is reported. A guess that no agent can confirm is
   dropped, not softened.
3. **Severity, ranked.** 🔴 blocks the merge in spirit, 🟡 is worth fixing, 🟣
   is real but not yours. The author reads the top of the list first.

## Severity

| Marker | Severity | Meaning |
| :- | :- | :- |
| 🔴 | Important | A bug that should be fixed before merging |
| 🟡 | Nit | A minor issue, worth fixing but not blocking |
| 🟣 | Pre-existing | A bug in the codebase that this change did not introduce |

Pre-existing findings are reported **separately**, never mixed into the list of
things the author broke. They are useful context; they are not the diff's fault.

## Workflow

### 1. Establish the scope

Default: this branch's commits ahead of its upstream, plus every uncommitted
and staged change in the working tree.

```bash
git status --short
git diff --stat
git diff --stat HEAD
git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline -5
```

If the user names a target — a file, a branch, a ref range like `main...HEAD`, a
PR number — review that instead. If there is nothing to review (clean tree, no
commits ahead), say so plainly rather than inventing work; or offer a full-repo
review if that is what "review this repo" means.

Read `AGENTS.md` and `REVIEW.md` before hunting. `AGENTS.md` holds the project's
own conventions and the non-obvious framework quirks; a finding that contradicts
a documented, deliberate decision is not a finding.

### 2. Fan out the hunters

Run the hunters as **parallel background subagents**, one lens each. Give each
one the scope, the file list, and its single mandate — do not ask a general
agent to "review the code", because that returns the loudest bug every time.

| Hunter | Mandate |
| - | - |
| `logic` | Wrong conditions, off-by-one, inverted boolean, early return that skips work, state that is set but never read |
| `security` | Injection, unscoped/unsanitised SQL, secrets in code, missing authz, leaked PII in logs or responses, path traversal |
| `edge-cases` | Empty and single-element inputs, `undefined`/`null`, zero and negative numbers, missing query params, concurrent calls |
| `regression` | Behaviour that callers still depend on — signature, return shape, status code, ordering, timing — that this change breaks |
| `framework` | Misuse of the stack documented in `AGENTS.md` (Next.js App Router, cacheComponents, Tailwind tokens, Vitest setup, SQLite constraints) |

Rules for the prompts:

- Tell each hunter to cite `file:line` for every claim, and to **read the code
  before claiming** it. An inferred-from-naming finding is noise.
- Tell each hunter it is **not alone** — no edits, no cross-file cleanup, no
  restyling. One finding per `file:line`, one sentence on the failure mode.
- Tell each hunter to return nothing rather than padding. An empty result is a
  valid result and is cheaper than a wrong finding.

Five hunters is the default. Scale down for a small diff, and say in the summary
which lenses you actually ran.

### 3. Verify every candidate

Take the union of the hunters' findings and **re-check each one against the
source yourself**, before any of it reaches the author. This pass is the whole
value of the review.

For each candidate, confirm:

- The code actually says what the hunter says it says (read the line, not the
  diff hunk).
- The described failure is reachable — is there an input that triggers it, or a
  caller that already guards it?
- The severity matches the blast radius.

Then:

- **Confirmed** → keep, at the severity the evidence supports.
- **Wrong** → drop. Do not report it as a hedged nit to avoid looking like you
  dropped it.
- **Real but pre-existing** → 🟣, moved to its own section.
- **Duplicate** across hunters → merge into one finding, noting the lenses that
  independently found it. Independent convergence is worth keeping in the output.

### 4. Report

Open the reply with a one-line tally — the shape of the work before the details.

```markdown
## Code review

2 factual, 3 style — no blocking issues.

### 🔴 Important

**`src/db/queries.ts:118` — unfiltered `LIKE` passes user input straight into the
query.** The `%` and `_` in `q` are not escaped, so a search for `100%` returns
every row with any digits after two. Fix: escape `\`, `%` and `_` in `q` before
building the pattern.

### 🟡 Nit
...

### 🟣 Pre-existing
...

### Not checked
- `scripts/` — skipped per `REVIEW.md`
```

Per finding: `file:line`, one sentence on what breaks, one on the fix. Why this
was flagged is optional — add it when the reasoning is non-obvious, skip it when
the fix is obvious.

Close by asking whether to apply the findings (`--fix` behaviour). Only edit
after the author says yes.

## Flags and arguments

| Argument | Effect |
| - | - |
| `--fix` | Apply the confirmed findings to the working tree after reporting them |
| `--max-findings <n>` | Report at most `n` findings, ranked by severity. `all` disables the cap |
| `<target>` | A file path, branch, `main...HEAD` ref range, or PR number to review instead of the default scope |
| `low` … `max` | Effort. `low` reports only the most confident findings — use it when the diff is large or the stakes are low. `high` is the default for a normal diff |

## Do not report

- Anything `npm run lint` or `npx tsc --noEmit` already enforces. Run them
  instead of reading the diff for style.
- Formatting, import ordering, and naming, unless `REVIEW.md` asks for them.
- Generated files, lockfiles, vendored code.
- Speculative "you might want to add tests here" with no failing scenario.
- Test-only code that intentionally violates a production rule.
- A documented, deliberate decision from `AGENTS.md` reported as a mistake.

## Local-repo notes

- Background subagent edits are **not** restored by `/rewind`. If this skill runs
  with `--fix` in a background subagent, say so and let the author revert with
  git instead.
- This repo has no CI. Nothing here is enforced automatically, which is why the
  verification pass carries the weight a CI gate would otherwise carry.
- `AGENTS.md` warns that `npm test` pins exact counts and lists derived from
  `seed-data.ts`. A diff touching seed data is expected to break those
  assertions; flag the *missing* update, not the failure itself.