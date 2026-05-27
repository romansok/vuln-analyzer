# CWE-22: Path Traversal

## Plain-English explanation
The app builds a file path from user input but doesn't check that the result stays inside the directory it should. By sending `../../etc/passwd`, an attacker escapes the intended folder and reads (or overwrites) files the app's process can touch.

## Typical attack pattern
A file-download endpoint takes a `filename` query parameter and serves `/var/app/uploads/<filename>`. The attacker requests `?filename=../../../etc/passwd`. The server resolves the path and dutifully streams `/etc/passwd` back. The same shape with `fs.writeFile` lets the attacker overwrite config or drop a shell script into a writable directory.

## Reachability hints
- `path.join(BASE, userInput)`, `fs.readFile(BASE + userInput)`, `fs.createReadStream(...)` where `userInput` came from a request.
- `os.path.join(BASE, request.args['name'])` in Python; `Files.newInputStream(Paths.get(BASE, name))` in Java.
- Archive extraction libraries (`zip`, `tar`, `unzipper`) — the entries themselves carry path strings ("zip-slip").
- Static-file servers configured with a base dir but no traversal check.

## Common workarounds when a bump is blocked
- Resolve to an absolute path and verify it begins with the canonical base directory: `resolved.startsWith(BASE + path.sep)`.
- Allowlist filename characters: `/^[a-zA-Z0-9._-]+$/` — reject anything with `/`, `\`, or `..`.
- Map user-facing identifiers to internal paths via a lookup table; never let user strings become path segments.
- For archive extraction: validate every entry's resolved path before writing.

## Concrete code example

```js
// Vulnerable
app.get('/file/:name', (req, res) => {
  res.sendFile(path.join('/srv/uploads', req.params.name));
  // ?name=../../../etc/passwd  →  /etc/passwd
});

// Safe
const BASE = path.resolve('/srv/uploads');
app.get('/file/:name', (req, res) => {
  const target = path.resolve(BASE, req.params.name);
  if (!target.startsWith(BASE + path.sep)) return res.status(400).end();
  res.sendFile(target);
});
```
