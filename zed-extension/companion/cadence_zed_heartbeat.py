import argparse
import hashlib
import json
import os
import platform
import time
import urllib.request


def project_hash(path):
    return hashlib.sha256(path.encode("utf-8")).hexdigest()[:16]


def send(args):
    cwd = os.getcwd()
    payload = {
        "apiKey": args.api_key,
        "ide": "zed",
        "timestamp": int(time.time() * 1000),
        "type": "connection_test" if args.test else None,
        "language": args.language or "unknown",
        "project": os.path.basename(cwd),
        "projectHash": project_hash(cwd),
        "platform": platform.system().lower(),
        "isIdle": False,
        "timezoneOffset": -time.timezone // 60,
        "localDate": time.strftime("%Y-%m-%d"),
    }
    body = json.dumps({k: v for k, v in payload.items() if v is not None}).encode("utf-8")
    request = urllib.request.Request(
        args.endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + args.api_key,
        },
        method="POST",
    )
    urllib.request.urlopen(request, timeout=5).read()


def main():
    parser = argparse.ArgumentParser(description="Cadence companion heartbeat for Zed")
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--endpoint", default="https://ca-dence.vercel.app/api/heartbeat")
    parser.add_argument("--language", default="")
    parser.add_argument("--interval", type=int, default=30)
    parser.add_argument("--test", action="store_true")
    args = parser.parse_args()

    if args.test:
        send(args)
        print("Cadence Zed connection test sent")
        return

    while True:
        send(args)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
