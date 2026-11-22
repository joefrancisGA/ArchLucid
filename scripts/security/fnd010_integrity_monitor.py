#!/usr/bin/env python3
"""Independent FND-010 checkpoint/chain verifier with fail-closed alert exit codes.

SQL is read-only; trusted checkpoint and public key are supplied outside SQL.
This command can be scheduled by an independent monitoring identity.
"""
from __future__ import annotations
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from cryptography.hazmat.primitives import serialization
try:
    from .fnd010_managed_checkpoint import verify_checkpoint
except ImportError:
    from fnd010_managed_checkpoint import verify_checkpoint


def sql_query(command: list[str], statement: str) -> str:
    result = subprocess.run([*command, "-Q", statement], capture_output=True,
                            text=True, timeout=90, check=True)
    return result.stdout


def verify_sql_chain(query, checkpoint: dict) -> dict:
    # Hash validation uses persisted payload bytes and does not reserialize JSON.
    # LAG checks ordering and all links, including first-row genesis.
    integrity = query("""
       SET NOCOUNT ON;
       WITH Links AS (
         SELECT SequenceNo, PreviousHash, RecordHash, Payload,
           LAG(RecordHash) OVER (ORDER BY SequenceNo) AS PriorHash
         FROM dbo.AuthorizationDecisionChain
       )
       SELECT COUNT(*) FROM Links WHERE
         PreviousHash <> COALESCE(PriorHash, CONVERT(VARBINARY(32),REPLICATE('0',64),2))
         OR RecordHash <> HASHBYTES('SHA2_256',
            0x01 + PreviousHash + HASHBYTES('SHA2_256',Payload))
    """)
    failures = parse_single_integer(integrity)
    if failures:
        raise ValueError(f"Audit hash-chain integrity violations: {failures}")

    journal = query("""
       SET NOCOUNT ON;
       SELECT COUNT(*) FROM dbo.AuthorizationDecisionChain c
       LEFT JOIN dbo.AuthorizationDecisionJournal j
         ON c.DecisionId=j.DecisionId
       WHERE j.DecisionId IS NULL
         OR TRY_CONVERT(UNIQUEIDENTIFIER,
              JSON_VALUE(CONVERT(NVARCHAR(MAX),c.Payload),'$.decisionId')) <> j.DecisionId
         OR TRY_CONVERT(UNIQUEIDENTIFIER,
              JSON_VALUE(CONVERT(NVARCHAR(MAX),c.Payload),'$.tenantId')) <> j.TenantId
         OR TRY_CONVERT(UNIQUEIDENTIFIER,
              JSON_VALUE(CONVERT(NVARCHAR(MAX),c.Payload),'$.resourceId')) <> j.ResourceId
         OR JSON_VALUE(CONVERT(NVARCHAR(MAX),c.Payload),'$.actionName') <> j.ActionName
         OR JSON_VALUE(CONVERT(NVARCHAR(MAX),c.Payload),'$.reasonCode') <> j.ReasonCode
         OR TRY_CONVERT(BIT,
              JSON_VALUE(CONVERT(NVARCHAR(MAX),c.Payload),'$.allowed')) <> j.Allowed
    """)
    # Legacy journal rows predate chain activation and require separate inventory.
    if parse_single_integer(journal):
        raise ValueError("Audit journal/chain record mismatch")

    stats = query("""
      SET NOCOUNT ON;
      SELECT CONCAT(COUNT_BIG(*),':',COALESCE(MAX(SequenceNo),0))
      FROM dbo.AuthorizationDecisionChain
    """)
    match = re.search(r"(?m)^\s*(\d+):(\d+)\s*$", stats)
    if not match:
        raise ValueError("Invalid SQL chain statistics")
    count, maximum = map(int, match.groups())
    if count != maximum:
        raise ValueError("Missing or non-contiguous SQL chain sequence")

    payload = checkpoint["payload"]
    seq, expected = payload["sequence"], payload["headSha256"]
    # Detect loss/rollback before attempting to look up a missing signed anchor.
    # Preserve distinct fail-closed diagnostics for missing versus forged history.
    if maximum < seq:
        raise ValueError("SQL chain rollback detected")
    if seq == 0:
        if expected != "00" * 32:
            raise ValueError("Invalid genesis anchor")
    else:
        anchored = query(f"""
          SET NOCOUNT ON;
          SELECT CONVERT(VARCHAR(64),RecordHash,2)
          FROM dbo.AuthorizationDecisionChain WHERE SequenceNo={seq}
        """)
        hashes = re.findall(r"(?m)^\s*([0-9A-Fa-f]{64})\s*$", anchored)
        if len(hashes) != 1 or hashes[0].lower() != expected:
            raise ValueError("Signed checkpoint does not match SQL history")
    return {"checkedRecords": count, "headSequence": maximum,
            "trustedCheckpointSequence": seq, "integrity": "verified"}


def parse_single_integer(output: str) -> int:
    matches = re.findall(r"(?m)^\s*(\d+)\s*$", output)
    if len(matches) != 1:
        raise ValueError("Unexpected SQL integrity result")
    return int(matches[0])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--pinned-public-key", required=True)
    parser.add_argument("--expected-key-id", required=True)
    parser.add_argument("--sqlcmd", nargs="+", required=True,
                        help="Trusted sqlcmd command including connection and -b -h -1 -W")
    parser.add_argument("--alert-file", required=True)
    args = parser.parse_args()
    alert = Path(args.alert_file)
    try:
        checkpoint = json.loads(Path(args.checkpoint).read_text())
        if checkpoint["payload"]["keyId"] != args.expected_key_id:
            raise ValueError("Checkpoint signing key is not allowlisted")
        public = serialization.load_pem_public_key(Path(args.pinned_public_key).read_bytes())
        verify_checkpoint(checkpoint, public)
        result = verify_sql_chain(lambda statement: sql_query(args.sqlcmd, statement), checkpoint)
        print(json.dumps(result, sort_keys=True))
        return 0
    except Exception as exc:
        # Alert artifact contains no database credentials, tokens, or raw records.
        result = {"severity": "critical", "component": "fnd010-audit-integrity",
                  "status": "verification_failed", "errorType": type(exc).__name__}
        alert.write_text(json.dumps(result, sort_keys=True) + "\n")
        print(json.dumps(result, sort_keys=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
