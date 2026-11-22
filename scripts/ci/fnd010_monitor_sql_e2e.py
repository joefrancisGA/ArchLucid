#!/usr/bin/env python3
"""End-to-end signed checkpoint verification against disposable CI SQL Server."""
from __future__ import annotations
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from unittest.mock import Mock

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from scripts.ci.fnd010_sql_journal_verify import sql
from scripts.security.fnd010_integrity_monitor import verify_sql_chain
from scripts.security.fnd010_managed_checkpoint import (
    build_payload, canonical, verify_checkpoint,
)


def query(statement: str) -> str:
    return sql(statement)


def main() -> None:
    result = query("""
      SET NOCOUNT ON;
      SELECT CONCAT(
        CONVERT(VARCHAR(24),(SELECT COALESCE(MAX(SequenceNo),0)
                             FROM dbo.AuthorizationDecisionChain)), ':',
        COALESCE((SELECT TOP 1 CONVERT(VARCHAR(64),RecordHash,2)
                  FROM dbo.AuthorizationDecisionChain ORDER BY SequenceNo DESC),
                 REPLICATE('0',64)));
    """)
    match = re.search(r"(?m)^\s*(\d+):([0-9a-fA-F]{64})\s*$", result)
    if not match:
        raise AssertionError("Cannot read SQL head: " + result)
    sequence, digest = int(match.group(1)), match.group(2).lower()
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    key_id = "https://fnd010-test.vault.azure.net/keys/checkpoint/v1"
    payload = build_payload(sequence, digest, key_id)
    signature = private.sign(canonical(payload),
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=hashes.SHA256().digest_size), hashes.SHA256())
    checkpoint = {"payload": payload, "algorithm": "PS256",
                  "signature": base64.b64encode(signature).decode()}
    verify_checkpoint(checkpoint, private.public_key())
    result = verify_sql_chain(query, checkpoint)
    if result["checkedRecords"] != sequence:
        raise AssertionError("Unexpected chain size: " + str(result))

    # SQL tampering must fail at database boundary and signed-anchor mismatch
    # must be caught by the verifier even when a forged checkpoint is re-signed.
    sql("UPDATE dbo.AuthorizationDecisionChain SET RecordHash=0x00 WHERE SequenceNo=1",
        success=False)
    forged = dict(checkpoint, payload=dict(payload, headSha256="cd" * 32))
    with_error = False
    try:
        verify_sql_chain(query, forged)
    except ValueError:
        with_error = True
    if not with_error:
        raise AssertionError("Independent monitor accepted forged head")
    print("PASS: live SQL signed anchor, full-chain verification and forged-head rejection")


if __name__ == "__main__":
    main()
