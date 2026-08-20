#!/usr/bin/env python3
"""Run a command on a remote host over SSH (key auth with password fallback)."""
import argparse, os, sys
import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def main():
    p = argparse.ArgumentParser(description="Run remote command over SSH")
    p.add_argument("host"); p.add_argument("user"); p.add_argument("command")
    p.add_argument("--key", default=os.path.expanduser("~/.ssh/id_ed25519_vahta"))
    p.add_argument("--upload", nargs=2, action="append", metavar=("LOCAL", "REMOTE"))
    a = p.parse_args()
    password = os.environ.get("SSH_PASS", "") or None
    c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(a.host, username=a.user, password=password,
              key_filename=a.key if os.path.exists(a.key) else None, timeout=30)
    if a.upload:
        s = c.open_sftp()
        for local, remote in a.upload:
            s.put(local, remote); print(f"uploaded {local} -> {remote}")
        s.close()
    stdin, stdout, stderr = c.exec_command(a.command, timeout=900)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out: print(out, end="")
    if err: print(err, end="", file=sys.stderr)
    c.close(); sys.exit(code)

if __name__ == "__main__":
    main()
