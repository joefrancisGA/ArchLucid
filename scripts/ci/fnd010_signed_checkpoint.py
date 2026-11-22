#!/usr/bin/env python3
"""FND-010 externally retainable Ed25519 checkpoint for the SQL decision chain.

The private signing key must be supplied by a separate trusted system, not SQL.
This script does not claim its output location is immutable storage.
"""
from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

DOMAIN = "archlucid.fnd010.authorization-checkpoint.v1"
GENESIS = "00" * 32


def canonical(record: dict) -> bytes:
    return json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                      allow_nan=False).encode("utf-8")


def head_from_sql(container: str, password: str) -> tuple[int, str]:
    query = """
    SET NOCOUNT ON;
    SELECT CONCAT(
      CONVERT(VARCHAR(24),(SELECT COALESCE(MAX(SequenceNo),0)
                           FROM dbo.AuthorizationDecisionChain)), ':',
      COALESCE((SELECT TOP 1 CONVERT(VARCHAR(64),RecordHash,2)
                FROM dbo.AuthorizationDecisionChain ORDER BY SequenceNo DESC),
               REPLICATE('0',64)));
    """
    result = subprocess.run([
        "docker", "exec", "-i", container, "/opt/mssql-tools18/bin/sqlcmd",
        "-S", "localhost", "-U", "sa", "-P", password, "-C", "-b", "-h", "-1",
        "-W", "-Q", query,
    ], text=True, capture_output=True, timeout=45, check=True)
    values = [line.strip() for line in result.stdout.splitlines() if ":" in line]
    if len(values) != 1:
        raise ValueError("Cannot determine unambiguous SQL chain head")
    sequence, digest = values[0].split(":", 1)
    if not sequence.isdecimal() or len(digest) != 64 or any(c not in "0123456789abcdefABCDEF" for c in digest):
        raise ValueError("Invalid chain head")
    return int(sequence), digest.lower()


def issue(sequence: int, digest: str, key_id: str, private_key: Ed25519PrivateKey,
          issued_at: str) -> dict:
    if sequence < 0 or len(digest) != 64 or not key_id:
        raise ValueError("Invalid checkpoint input")
    payload = dict(domain=DOMAIN, sequence=sequence, headSha256=digest.lower(),
                   keyId=key_id, issuedAt=issued_at)
    signature = private_key.sign(canonical(payload))
    return {"payload": payload, "signature": base64.b64encode(signature).decode("ascii")}


def verify(checkpoint: dict, public_key: Ed25519PublicKey, *, current_head: tuple[int, str] | None = None,
           trusted_minimum: tuple[int, str] | None = None) -> None:
    payload = checkpoint["payload"]
    if set(payload) != {"domain", "sequence", "headSha256", "keyId", "issuedAt"} or payload["domain"] != DOMAIN:
        raise ValueError("Invalid checkpoint domain or fields")
    if type(payload["sequence"]) is not int or payload["sequence"] < 0:
        raise ValueError("Invalid sequence")
    digest = payload["headSha256"]
    if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("Invalid digest")
    signature = base64.b64decode(checkpoint["signature"], validate=True)
    public_key.verify(signature, canonical(payload))
    if current_head is not None and current_head != (payload["sequence"], digest):
        raise ValueError("Current SQL head differs from signed checkpoint")
    if trusted_minimum is not None:
        min_sequence, min_digest = trusted_minimum
        if payload["sequence"] < min_sequence or (
            payload["sequence"] == min_sequence and digest != min_digest
        ):
            raise ValueError("Checkpoint rollback or fork detected")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=["issue", "verify"])
    parser.add_argument("--container", default="fnd010-sql")
    parser.add_argument("--password-env", default="FND010_SQL_PASSWORD")
    parser.add_argument("--private-key")
    parser.add_argument("--public-key", required=True)
    parser.add_argument("--key-id", default="test-checkpoint-key")
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--compare-sql", action="store_true")
    args = parser.parse_args()
    import os
    head = head_from_sql(args.container, os.environ[args.password_env]) if args.operation == "issue" or args.compare_sql else None
    public_key = serialization.load_pem_public_key(Path(args.public_key).read_bytes())
    if not isinstance(public_key, Ed25519PublicKey):
        raise ValueError("Expected Ed25519 public key")
    if args.operation == "issue":
        if not args.private_key:
            raise ValueError("External private signing key required")
        private_key = serialization.load_pem_private_key(Path(args.private_key).read_bytes(), password=None)
        if not isinstance(private_key, Ed25519PrivateKey):
            raise ValueError("Expected Ed25519 private key")
        if private_key.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw
        ) != public_key.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw):
            raise ValueError("Signing key does not match trusted verification key")
        checkpoint = issue(*head, args.key_id, private_key,
                           datetime.now(timezone.utc).isoformat())
        Path(args.checkpoint).write_text(json.dumps(checkpoint, sort_keys=True, indent=2) + "\n")
    else:
        verify(json.loads(Path(args.checkpoint).read_text()), public_key, current_head=head)
    print(f"PASS: {args.operation} signed FND-010 checkpoint")


if __name__ == "__main__":
    main()
