---
description: Security review of the changes on this branch (SQL injection, XSS, auth, data exposure)
agent: general
---

You are a senior security engineer conducting a focused security review of the changes on this branch.

Arguments: $ARGUMENTS

If `$ARGUMENTS` is non-empty, treat it as a git base ref (e.g. `main`, `HEAD~3`) and review the committed changes in `BASE...HEAD`. If it is empty, review the uncommitted working-tree changes against `HEAD`.

Collect the diff yourself with your own shell tool — do not ask the user to paste it:

```
git status --short
git log --no-decorate --oneline -10
git diff --merge-base <BASE> HEAD        # when a base ref was given
git diff HEAD                            # otherwise: working tree vs HEAD
```

For a new repository with a single commit there is no meaningful `origin/HEAD`; if the diff is empty, say so and review the whole tracked tree at `git ls-files` instead.

OBJECTIVE:

Perform a security-focused code review to identify HIGH-CONFIDENCE security vulnerabilities with real exploitation potential. This is not a general code review — focus ONLY on security implications introduced by these changes. Do not comment on pre-existing security concerns.

CRITICAL INSTRUCTIONS:

1. MINIMIZE FALSE POSITIVES: Only flag issues where you're >80% confident of actual exploitability.
2. AVOID NOISE: Skip theoretical issues, style concerns, or low-impact findings.
3. FOCUS ON IMPACT: Prioritize vulnerabilities leading to unauthorized access, data breach, or system compromise.
4. EXCLUSIONS: Do NOT report: Denial of Service, secrets-on-disk (handled elsewhere), rate limiting, or resource exhaustion.

SECURITY CATEGORIES TO EXAMINE:

Input validation:
- SQL injection via unsanitised user input reaching a query
- Command injection in system calls or subprocesses
- XXE in XML parsing, template injection, NoSQL injection
- Path traversal in file operations

Authentication & authorization:
- Authentication bypass, privilege escalation, IDOR, session flaws, JWT problems

Injection & code execution:
- RCE via deserialisation, `eval` injection
- XSS (reflected, stored, DOM-based)

Data exposure:
- Sensitive data logging or storage, PII handling violations
- API endpoint data leakage, debug information exposure

Stack context for this repo (read the files, do not assume):
- Next.js App Router with React Server Components — `next.config.ts` has `cacheComponents`, `serverExternalPackages: ["better-sqlite3"]`.
- SQLite via `better-sqlite3` from `src/db/queries.ts` (bound parameters = safe; string-concatenated SQL or dynamic `ORDER BY` built from user input = injection).
- JSON API under `src/app/api/**` — these handlers receive untrusted `params` / `searchParams` from the network and are the primary attack surface.
- No auth, no multi-tenancy, no sessions, no cart state yet.

ANALYSIS METHODOLOGY:

Phase 1 — Repository context: identify existing validation/sanitisation patterns and the project's security model before judging the diff.

Phase 2 — Comparative analysis: compare the new code against existing secure patterns in the repo. Flag deviations and newly introduced attack surface.

Phase 3 — Vulnerability assessment: for each modified file, trace data flow from untrusted input (URL params, query strings, request bodies, headers) to sensitive sinks (SQL, filesystem, HTML output, subprocesses, logs). Name the concrete input that triggers it.

REQUIRED OUTPUT FORMAT:

Output your findings as markdown. Each finding must contain file, line number, severity, category (e.g. `sql_injection`, `xss`), description, exploit scenario, and fix recommendation. Example:

# Vuln 1: XSS: `src/app/search/page.tsx:42`

* Severity: High
* Description: The `q` query param is interpolated into HTML without escaping, allowing reflected XSS.
* Exploit Scenario: Attacker sends `/search?q=<script>alert(document.cookie)</script>`; the script runs in the victim's browser and steals the session.
* Recommendation: Escape at render time, or use the framework's auto-escaping output primitive instead of raw HTML injection.

SEVERITY:
- HIGH: directly exploitable, leading to RCE, data breach, or auth bypass
- MEDIUM: requires specific conditions but has significant impact
- LOW: defence-in-depth

CONFIDENCE SCORING:
- 0.9–1.0 certain exploit path
- 0.8–0.9 clear pattern with known exploitation
- 0.7–0.8 suspicious, needs specific conditions
- below 0.7: do not report

FINAL REMINDER: Focus on HIGH and MEDIUM only. Every finding must be something a security engineer would confidently raise in a PR review.

FALSE POSITIVE FILTERING:

Do not run commands to reproduce the vulnerability — read the code and decide. Do not write to any files.

HARD EXCLUSIONS — automatically drop findings matching these:
1. Denial of Service or resource exhaustion.
2. Secrets/credentials stored on disk if otherwise secured.
3. Rate limiting and service overload.
4. Memory/CPU exhaustion.
5. Missing input validation on non-security-critical fields without proven impact.
6. Input sanitisation concerns for GitHub Actions workflows unless clearly triggerable by untrusted input.
7. A lack of hardening. Flag concrete vulnerabilities, not missing best practices.
8. Theoretical race conditions or timing attacks.
9. Outdated third-party libraries — managed separately.
10. Memory safety issues in memory-safe languages.
11. Files that are only unit tests or only used when running tests.
12. Log spoofing. Un-sanitised user input in logs is not a vulnerability.
13. SSRF that only controls the path — only a concern if it controls host or protocol.
14. User-controlled content in AI system prompts.
15. Regex injection, and regex DoS.
16. Insecure documentation — do not report findings in markdown files.
17. A lack of audit logs.

PRECEDENTS:
1. Logging high-value secrets in plaintext IS a vulnerability. Logging URLs is assumed safe.
2. UUIDs are unguessable; do not require validation.
3. Environment variables and CLI flags are trusted values. Findings that rely on controlling an env var are invalid.
4. Resource and file-descriptor leaks are not valid findings.
5. Tabnabbing, XS-Leaks, prototype pollution, and open redirects are not reported unless extremely high confidence.
6. React escapes by default. Do NOT report XSS in `.tsx` components unless they use `dangerouslySetInnerHTML` or an equivalent unsafe sink.
7. Most GitHub Actions workflow findings are not exploitable — require a concrete, specific attack path.
8. Missing permission/auth checks in client-side TS is NOT a vulnerability; the server is responsible for validation.
9. Only include MEDIUM findings if they are obvious and concrete.
10. Findings in `*.ipynb` need a concrete path where untrusted input triggers them.
11. Logging non-PII data is not a vulnerability, even if sensitive. Only secrets/passwords/PII count.
12. Command injection in shell scripts is generally not exploitable; require a concrete path for untrusted input.

SIGNAL QUALITY:
1. Is there a concrete, exploitable vulnerability with a clear attack path?
2. Real security risk vs theoretical best practice?
3. Specific code locations and reproduction steps?
4. Actionable for a security team?

Assign each finding a confidence score from 1–10 (1–3 likely false positive, 4–6 needs investigation, 7–10 likely true vulnerability).

PROCEDURE:

1. Launch one subagent to identify vulnerabilities. Give it the repository exploration context and everything above.
2. For each vulnerability it reports, launch a parallel subagent to filter false positives, passing the FALSE POSITIVE FILTERING section.
3. Drop any finding with a confidence below 8.

Your final reply must contain the markdown report and nothing else.