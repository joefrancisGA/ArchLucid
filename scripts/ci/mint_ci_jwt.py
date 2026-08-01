#!/usr/bin/env python3
"""
Mint an RS256 JWT for ArchLucid live E2E when the API uses ArchLucidAuth:JwtSigningPublicKeyPemPath.

Dependencies (CI): pip install PyJWT cryptography

Example:
  openssl genrsa -out /tmp/priv.pem 2048
  openssl rsa -in /tmp/priv.pem -pubout -out /tmp/pub.pem
  python3 scripts/ci/mint_ci_jwt.py --private-key /tmp/priv.pem --issuer https://ci.local \\
    --audience api://archlucid-e2e --out-token /tmp/token.txt
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Mint CI JWT (RS256).")
    parser.add_argument("--private-key", required=True, help="Path to PEM private key (PKCS#8 or RSA).")
    parser.add_argument("--issuer", required=True)
    parser.add_argument("--audience", required=True)
    parser.add_argument("--sub", default="jwt-e2e-sub")
    parser.add_argument("--name", default="JwtE2eAdmin", help="Matches LIVE_JWT_ACTOR_NAME / JWT name claim.")
    parser.add_argument("--roles", nargs="+", default=["Admin"], help="ArchLucid role names (e.g. Admin Operator Reader).")
    parser.add_argument(
        "--tenant-id",
        default="",
        help="Optional tenant_id claim (GUID). When omitted, API scope falls back to ScopeIds.DefaultTenant.",
    )
    parser.add_argument("--workspace-id", default="", help="Optional workspace_id claim (GUID).")
    parser.add_argument("--project-id", default="", help="Optional project_id claim (GUID).")
    parser.add_argument("--out-token", default="", help="Write JWT string to this file.")
    parser.add_argument(
        "--print-token",
        action="store_true",
        help="Print JWT to stdout (for CD smoke; do not log in public CI output).",
    )
    args = parser.parse_args()

    if not args.print_token and not args.out_token:
        print("Either --out-token or --print-token is required.", file=sys.stderr)
        return 2

    try:
        import jwt
    except ImportError:
        print("PyJWT is required: pip install PyJWT cryptography", file=sys.stderr)
        return 2

    priv_path = Path(args.private_key)
    if not priv_path.is_file():
        print(f"Private key not found: {priv_path}", file=sys.stderr)
        return 1

    private_pem = priv_path.read_text(encoding="utf-8")
    now = int(time.time())
    payload = {
        "sub": args.sub,
        "name": args.name,
        "roles": args.roles,
        "iat": now,
        "nbf": now - 5,
        "exp": now + 3600,
        "iss": args.issuer,
        "aud": args.audience,
    }
    for claim_key, raw in (
        ("tenant_id", args.tenant_id),
        ("workspace_id", args.workspace_id),
        ("project_id", args.project_id),
    ):
        value = raw.strip()
        if value:
            payload[claim_key] = value

    encoded = jwt.encode(payload, private_pem, algorithm="RS256")
    token_str = encoded if isinstance(encoded, str) else encoded.decode("ascii")
    token_str = token_str.strip()

    if args.out_token:
        Path(args.out_token).write_text(token_str + "\n", encoding="utf-8")
        print(f"Wrote JWT to {args.out_token}")

    if args.print_token:
        print(token_str)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
