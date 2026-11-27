#!/usr/bin/env python3
"""Validate confirmed defect dispositions and their local, digest-bound receipts."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

TEST_DISPOSITIONS = {"regression-test", "property-test", "metamorphic-test"}
VALID = TEST_DISPOSITIONS | {"structural-prevention", "documented-nonautomatable"}
DEFECT_ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}")
REVISION = re.compile(r"[0-9a-f]{40}")
DIGEST = re.compile(r"[0-9a-f]{64}")
MAX_ARTIFACT_BYTES = 1024 * 1024


def unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON field")
        result[key] = value
    return result


def reject_constant(_value: str) -> None:
    raise ValueError("invalid JSON number")


def parse_json(raw: bytes) -> object:
    return json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object, parse_constant=reject_constant)


def nonblank(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def matches(pattern: re.Pattern, value: object) -> bool:
    return isinstance(value, str) and pattern.fullmatch(value) is not None


def load_receipt(row: dict, artifact_root: Path) -> dict:
    reference = row.get("regressionArtifact")
    digest = row.get("regressionArtifactSha256")
    if not nonblank(reference) or not isinstance(reference, str) or "\\" in reference:
        raise ValueError("regressionArtifact must be a relative receipt path")
    relative = Path(reference)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("regressionArtifact must stay inside the artifact root")
    if not matches(DIGEST, digest):
        raise ValueError("regressionArtifactSha256 must be a lowercase SHA-256 digest")
    try:
        root = artifact_root.resolve()
        path = (root / relative).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError("regressionArtifact must resolve to a file inside the artifact root")
        with path.open("rb") as handle:
            raw = handle.read(MAX_ARTIFACT_BYTES + 1)
    except (OSError, RuntimeError):
        raise ValueError("regressionArtifact could not be read") from None
    if not raw or len(raw) > MAX_ARTIFACT_BYTES:
        raise ValueError("regressionArtifact is empty or too large")
    if hashlib.sha256(raw).hexdigest() != digest:
        raise ValueError("regressionArtifactSha256 does not match the receipt")
    try:
        receipt = parse_json(raw)
    except (ValueError, RecursionError):
        raise ValueError("regressionArtifact is not a valid JSON receipt") from None
    if not isinstance(receipt, dict) or type(receipt.get("schemaVersion")) is not int or receipt["schemaVersion"] != 1:
        raise ValueError("regressionArtifact must be a version 1 receipt object")
    return receipt


def validate_run(run: object, phase: str, identity: str, reason: str) -> list[str]:
    if not isinstance(run, dict):
        return [f"{phase} must be an executed test observation"]
    errors = []
    if not matches(REVISION, run.get("revision")):
        errors.append(f"{phase} requires a full lowercase commit SHA")
    if run.get("testIdentity") != identity:
        errors.append(f"{phase} testIdentity does not match the receipt")
    count = run.get("executedCount")
    if type(count) is not int or count < 1:
        errors.append(f"{phase} must record nonzero tests executed for the cited identity")
    status = run.get("exitCode")
    if phase == "baseline":
        if run.get("outcome") != "assertion-failed" or type(status) is not int or not (1 <= status < 124):
            errors.append("baseline must record an executed assertion failure and its nonzero exit code")
        if not nonblank(run.get("failureReason")) or run.get("failureReason") != reason:
            errors.append("baseline failureReason does not match expectedFailureReason")
    elif run.get("outcome") != "passed" or type(status) is not int or status != 0:
        errors.append("corrected must record a passing result with exit code zero")
    return errors


def validate_receipt(receipt: dict, row: dict) -> list[str]:
    errors = []
    disposition = row["regressionDisposition"]
    if receipt.get("defectId") != row["defectId"] or receipt.get("regressionDisposition") != disposition:
        errors.append("receipt does not match defectId and regressionDisposition")
    if not nonblank(receipt.get("intendedBehavior")):
        errors.append("receipt requires intendedBehavior")
    if disposition == "structural-prevention":
        proof = receipt.get("proof")
        if not isinstance(proof, dict) or proof.get("outcome") != "verified" or not all(
            nonblank(proof.get(key)) for key in ("mechanism", "verificationReference")
        ) or not matches(REVISION, proof.get("revision")):
            errors.append("structural prevention requires a revision-bound mechanism and verified proof reference")
        return errors

    identity = receipt.get("testIdentity")
    reason = receipt.get("expectedFailureReason")
    if not nonblank(identity) or not nonblank(reason):
        errors.append("test receipt requires testIdentity and expectedFailureReason")
    for phase in ("baseline", "corrected"):
        errors.extend(validate_run(receipt.get(phase), phase, identity, reason))
    baseline = receipt.get("baseline")
    corrected = receipt.get("corrected")
    if isinstance(baseline, dict) and isinstance(corrected, dict) and baseline.get("revision") == corrected.get("revision"):
        errors.append("baseline and corrected revisions must differ")
    return errors


def ledger_records(payload: object) -> list | None:
    records = payload.get("defects") if isinstance(payload, dict) else payload
    return records if isinstance(records, list) else None


def validate(payload: object, *, artifact_root: Path) -> list[str]:
    records = ledger_records(payload)
    if records is None:
        return ["ledger must be a list or an object with a defects list"]

    seen = set()
    errors = []
    for index, row in enumerate(records, 1):
        prefix = f"row {index}"
        if not isinstance(row, dict):
            errors.append(f"{prefix}: defect must be an object")
            continue
        defect_id = row.get("defectId")
        if not matches(DEFECT_ID, defect_id):
            errors.append(f"{prefix}: invalid/missing defectId")
            continue
        prefix = f"{prefix} ({defect_id})"
        if defect_id in seen:
            errors.append(f"{prefix}: duplicate defectId")
            continue
        seen.add(defect_id)
        confirmed = row.get("confirmed", True)
        if type(confirmed) is not bool:
            errors.append(f"{prefix}: confirmed must be a boolean")
            continue
        if not confirmed:
            continue
        disposition = row.get("regressionDisposition")
        if not isinstance(disposition, str) or disposition not in VALID:
            errors.append(f"{prefix}: invalid/missing regressionDisposition")
            continue
        if disposition == "documented-nonautomatable":
            for field in ("owner", "reason", "revisitCondition", "approvedBy"):
                if not nonblank(row.get(field)):
                    errors.append(f"{prefix}: nonautomatable disposition requires {field}")
            continue
        try:
            receipt = load_receipt(row, artifact_root)
        except ValueError as exc:
            errors.append(f"{prefix}: {exc}")
            continue
        errors.extend(f"{prefix}: {error}" for error in validate_receipt(receipt, row))
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", type=Path)
    parser.add_argument("--artifact-root", type=Path, help="Local receipt directory (default: ledger parent)")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)
    records = None
    try:
        payload = parse_json(args.ledger.read_bytes())
    except (OSError, ValueError, RecursionError):
        errors = ["ledger could not be read as valid JSON"]
        status = 2
    else:
        errors = validate(payload, artifact_root=args.artifact_root or args.ledger.parent)
        records = ledger_records(payload)
        status = 1 if args.enforce and errors else 0
    print(json.dumps({
        "schemaVersion": 1,
        "recordCount": None if records is None else len(records),
        "confirmedCount": None if records is None else sum(
            isinstance(row, dict) and row.get("confirmed", True) is True for row in records
        ),
        "errorCount": len(errors),
        "errors": errors,
    }, indent=2))
    return status


if __name__ == "__main__":
    raise SystemExit(main())
