#!/usr/bin/env python3
"""Read-only audit of three generated ArchLucid proof folders.

Never writes to canonical G4 log, upgrades customer claims or sends artifacts.
All reported data is aggregate: no run IDs, customers, URLs or raw proof content.
"""
from __future__ import annotations
import argparse
import json
import uuid
from collections import Counter
from pathlib import Path

REQUIRED = ("sponsorPacketDisposition", "sponsorHandoffMode", "runId",
            "realModeEvidenceStatus", "executionModeEvidenceCaptured",
            "aiReadinessGate", "roiSponsorSafe", "blockCount", "sendEligible")
MAX_BYTES = 4 * 1024 * 1024


def audit_one(payload: object) -> tuple[str | None, list[str]]:
    if not isinstance(payload, dict):
        return None, ["INVALID_PROOF_JSON"]
    problems = []
    for key in REQUIRED:
        if key not in payload:
            problems.append("MISSING_" + key)
    run_id = payload.get("runId")
    try:
        normalized = str(uuid.UUID(str(run_id)))
        if uuid.UUID(normalized).int == 0:
            raise ValueError()
    except (ValueError, TypeError, AttributeError):
        normalized = None
        problems.append("INVALID_RUN_ID")
    if payload.get("sponsorPacketDisposition") != "SEND":
        problems.append("NOT_SPONSOR_SEND")
    if payload.get("sponsorHandoffMode") is not True:
        problems.append("NOT_SPONSOR_HANDOFF_MODE")
    if payload.get("realModeEvidenceStatus") != "PASS":
        problems.append("NO_PASSING_REAL_MODE_EVIDENCE")
    if payload.get("executionModeEvidenceCaptured") is not True:
        problems.append("NO_EXECUTION_MODE_PROOF")
    if payload.get("roiSponsorSafe") is not True:
        problems.append("ROI_BASIS_NOT_SPONSOR_SAFE")
    if payload.get("sendEligible") is not True:
        problems.append("SEND_NOT_ELIGIBLE")
    if type(payload.get("blockCount")) is not int or payload["blockCount"] != 0:
        problems.append("BLOCKING_FINDINGS")
    gate = payload.get("aiReadinessGate")
    if not isinstance(gate, dict) or gate.get("disposition") != "PASS":
        problems.append("AI_READINESS_NOT_PASS")
    return normalized, sorted(set(problems))


def audit_paths(directories: list[Path]) -> dict:
    if len(directories) > 20:
        raise ValueError("At most 20 proof folders per audit")
    seen = set()
    records = []
    for folder in directories:
        path = folder / "go-no-go-summary.json"
        if not path.is_file() or path.stat().st_size > MAX_BYTES:
            records.append({"candidate": False, "problems": ["MISSING_OR_OVERSIZED_SUMMARY"]})
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError, UnicodeError):
            records.append({"candidate": False, "problems": ["UNREADABLE_SUMMARY"]})
            continue
        identity, issues = audit_one(payload)
        if identity is not None:
            if identity in seen:
                issues.append("DUPLICATE_COMMITTED_RUN_ID")
            seen.add(identity)
        records.append({"candidate": not issues, "problems": sorted(set(issues))})
    counts = Counter(x for record in records for x in record["problems"])
    candidates = sum(x["candidate"] for x in records)
    return {
        "schemaVersion": 1,
        "status": "OWNER_VERIFICATION_REQUIRED",
        "source": "GENERATED_GO_NO_GO_SUMMARIES_UNATTESTED",
        "suppliedProofFolders": len(directories),
        "distinctCandidateCount": candidates,
        "requiredDistinctRealRuns": 3,
        "meetsLocalMetadataPrerequisites": candidates >= 3,
        "blockingReasons": dict(sorted(counts.items())),
        "canonicalG4Gate": "UNCHANGED",
        "customerEvidenceVerified": False,
        "notes": [
            "Even three locally coherent summaries are NOT independently verified real Azure OpenAI runs.",
            "Require original Actions/host/run integrity, source redaction and owner signoff.",
            "No run identifiers, host URLs, tenant details or customer information are exported.",
        ],
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--proof-dir", action="append", type=Path, default=[])
    p.add_argument("--output", required=True, type=Path)
    a=p.parse_args()
    result=audit_paths(a.proof_dir)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Pilot proof candidate audit: {result['distinctCandidateCount']}/3 metadata candidates; "
          "official G4 gate unchanged; owner validation required.")

if __name__=="__main__":
    main()
