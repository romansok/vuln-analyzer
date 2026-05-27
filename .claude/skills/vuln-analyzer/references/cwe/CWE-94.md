# CWE-94: Code Injection

## Plain-English explanation
User input is executed as code. Different from command injection (which targets an OS shell) and SQL injection (which targets a DB). Code injection means the *application's own* interpreter — `eval`, `Function()`, `exec`, template-as-code, sandbox bypass — runs strings the attacker supplied.

## Typical attack pattern
A "formula" feature lets users define spreadsheet-like expressions: `revenue * 1.2`. The server evaluates these with `eval(formula)`. An attacker submits `process.mainModule.require('child_process').execSync('id')` as their "formula". The server returns the result; full RCE.

## Reachability hints
- `eval`, `Function(...)`, `setTimeout(string, ...)`, `setInterval(string, ...)` in JS.
- `exec`, `compile + exec`, `__import__`, `pickle.loads`, `yaml.load` (unsafe) in Python.
- `Object.constructor(...)` tricks where you reach `Function` from a property access.
- Template engines compiled at runtime with user input as the template body.
- Sandbox libraries whose escape advisories almost always map to CWE-94/CWE-74.

## Common workarounds when a bump is blocked
- Replace `eval` with a real expression parser — for spreadsheets, use `mathjs.evaluate(formula, scope)` (without `import`/`createUnit`/etc), or a dedicated DSL.
- Run the interpreter in a separate process with seccomp + a memory cap. Treat any in-process JS sandbox advisory as "moveable to a subprocess".
- Disable serialization formats that auto-call constructors: switch `pickle` to JSON, `yaml.load` to `yaml.safe_load`.
- Add static lints that ban the dangerous APIs across the repo.

## Concrete code example

```js
// Vulnerable
app.post('/formula', (req, res) => {
  const value = eval(req.body.formula);   // full RCE
  res.json({ value });
});

// Safer — bounded expression evaluator
import { evaluate } from 'mathjs';
const scope = { revenue: 100 };
app.post('/formula', (req, res) => {
  const value = evaluate(req.body.formula, scope);  // no global access
  res.json({ value });
});
```
