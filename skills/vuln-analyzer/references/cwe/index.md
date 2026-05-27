# CWE playbook index

One file per seeded CWE. Sub-agents read only the entries relevant to a
given vulnerability — keeps context tight.

| CWE | Name | One-line |
| --- | --- | --- |
| [CWE-20](CWE-20.md) | Improper Input Validation | The app accepts whatever the user sends without checking it's the shape it expects. |
| [CWE-22](CWE-22.md) | Path Traversal | A filename built from user input lets attackers escape to other files via `../`. |
| [CWE-74](CWE-74.md) | Injection (parent) | Untrusted input crosses into a different interpreter — shell, SQL, code, template. |
| [CWE-77](CWE-77.md) | Command Injection | User input is concatenated into a shell command and the shell executes it. |
| [CWE-78](CWE-78.md) | OS Command Injection | Same as CWE-77 but specifically against an OS shell. |
| [CWE-79](CWE-79.md) | Cross-site Scripting (XSS) | User input ends up as live HTML/JS in another user's browser. |
| [CWE-89](CWE-89.md) | SQL Injection | User input is concatenated into a SQL string and the DB executes it. |
| [CWE-94](CWE-94.md) | Code Injection | User input is `eval`'d, `Function()`'d, or otherwise executed as code. |
| [CWE-200](CWE-200.md) | Information Exposure | The app leaks data it shouldn't — stack traces, IDs, secrets in logs. |
| [CWE-287](CWE-287.md) | Improper Authentication | Identity checks are missing, weak, or bypassable. |
| [CWE-327](CWE-327.md) | Broken or Risky Crypto | Weak algorithm, weak key, wrong mode, reused IV — math that doesn't protect what it should. |
| [CWE-352](CWE-352.md) | CSRF | A logged-in user is tricked into making a state-changing request they didn't intend. |
| [CWE-400](CWE-400.md) | Uncontrolled Resource Consumption (DoS) | A small input causes large work — CPU, memory, file handles. |
| [CWE-502](CWE-502.md) | Insecure Deserialization | The app trusts a serialized blob to reconstruct objects; an attacker crafts a malicious one. |
| [CWE-611](CWE-611.md) | XXE — XML External Entity | XML parser fetches/reads external entities the attacker controls. |
| [CWE-770](CWE-770.md) | Allocation Without Limits (incl. ReDoS) | No upper bound on memory/CPU per request; one bad input kills the server. |
| [CWE-862](CWE-862.md) | Missing Authorization | The endpoint authenticates you but doesn't check you're allowed to do the action. |
| [CWE-918](CWE-918.md) | SSRF — Server-Side Request Forgery | The server fetches a URL the attacker chose; lets them reach internal services. |
| [CWE-1321](CWE-1321.md) | Prototype Pollution | Untrusted object merge writes to `__proto__`; pollutes shared prototypes across the app. |

Entry template (use this when adding new CWEs):

```markdown
# CWE-XX: <name>

## Plain-English explanation
2–3 sentences a developer reads in 10 seconds.

## Typical attack pattern
One concrete paragraph telling a small story.

## Reachability hints
Bullet list of code shapes / API calls / sinks to grep for.

## Common workarounds when a bump is blocked
- Bullet list of structural mitigations.

## Concrete code example
Before / after snippet showing vulnerable → safe.
```
