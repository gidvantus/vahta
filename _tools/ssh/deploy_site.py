#!/usr/bin/env python3
"""Deploy a local folder to the remote server over SFTP (key auth)."""
import argparse, os, sys
import paramiko

def main():
    p = argparse.ArgumentParser(description="Deploy folder to remote host")
    p.add_argument("host"); p.add_argument("user"); p.add_argument("local_dir")
    p.add_argument("remote_dir", default="/opt/vahta", nargs="?")
    p.add_argument("--key", default=os.path.expanduser("~/.ssh/id_ed25519_vahta"))
    a = p.parse_args()
    password = os.environ.get("SSH_PASS", "") or None
    c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(a.host, username=a.user, password=password,
              key_filename=a.key if os.path.exists(a.key) else None, timeout=30)
    stdin, stdout, stderr = c.exec_command("rm -rf %s/*" % a.remote_dir, timeout=60)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        print(stderr.read().decode(errors="replace"), file=sys.stderr); sys.exit(code)
    s = c.open_sftp(); count = 0
    for root, dirs, files in os.walk(a.local_dir):
        rel = os.path.relpath(root, a.local_dir)
        target = a.remote_dir if rel == "." else a.remote_dir + "/" + rel.replace("\\", "/")
        try: s.stat(target)
        except IOError: s.mkdir(target)
        for f in files:
            s.put(os.path.join(root, f), target + "/" + f); count += 1
    s.close(); print("uploaded %d files" % count); c.close(); sys.exit(0)

if __name__ == "__main__":
    main()
