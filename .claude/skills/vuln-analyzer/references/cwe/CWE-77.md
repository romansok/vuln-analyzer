# CWE-77: Command Injection

## Plain-English explanation
User input gets concatenated into a command string that the app hands to *some* command interpreter — a shell, a database `EXEC`, a mail-system `pipe to sendmail`. The interpreter treats characters like `;`, `&`, `` ` ``, or `|` as separators and runs whatever the attacker tucked in.

## Typical attack pattern
An admin panel takes a hostname and runs `ping -c 1 <host>` to show uptime. The attacker enters `8.8.8.8; cat /etc/passwd`. The shell sees two commands, runs both, and returns the file contents in the response body.

## Reachability hints
- `exec`, `system`, `popen` with a string argument built from user input.
- Mailer libraries that pipe to `sendmail` with a `-f` flag containing user input.
- ImageMagick-style tools where user-controlled file paths reach the command line (the classic `ImageTragick`).
- Any "command builder" that uses string concat instead of an argv list.

## Common workarounds when a bump is blocked
- Switch to APIs that take an argv array — `child_process.execFile`, `spawn` (without `shell: true`), `subprocess.run([...], shell=False)`. The shell never sees the user input.
- Allowlist the user input against a strict regex (`^[a-zA-Z0-9.-]+$` for a hostname).
- Disallow `;`, `|`, `&`, `` ` ``, `$(`, `>`, `<`, and whitespace at the input layer.
- Run the command inside a heavily restricted user/container so the blast radius shrinks.

## Concrete code example

```js
// Vulnerable
exec(`ping -c 1 ${host}`, (err, out) => res.send(out));

// Safe
execFile('ping', ['-c', '1', host], (err, out) => res.send(out));
// even if `host` is "8.8.8.8; rm -rf /", it's just one argv string.
```
