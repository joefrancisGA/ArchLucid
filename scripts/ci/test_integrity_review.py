"""Advisory FND-163 disposition input. No record can hide a finding."""

from collections import Counter
from datetime import date
import json
import re

from test_integrity_patterns import identity

REVIEW_PATH = "scripts/ci/test-integrity-review.json"
HEX = re.compile(r"[0-9a-f]{64}")
HTTPS = re.compile(r"https://[^\s]+")
MAX_RECORDS = 500


def disposition_index(raw: str, today: date) -> dict[str, dict]:
    doc = json.loads(raw)
    if not isinstance(doc, dict) or set(doc) != {"schema_version", "records"} or doc["schema_version"] != 1:
        raise ValueError("unsupported disposition schema")
    if not isinstance(doc["records"], list) or len(doc["records"]) > MAX_RECORDS:
        raise ValueError("invalid disposition list")
    result = {}
    for row in doc["records"]:
        if not isinstance(row, dict):
            raise ValueError("invalid disposition")
        required = {"finding_id", "path", "decision", "owner", "reason", "evidence", "revisit"}
        if set(row) not in (required, required | {"expires"}) or any(
                not isinstance(v, str) or not v.strip() or len(v) > 1000 for v in row.values()):
            raise ValueError("disposition requires an exact ID and path, decision, owner, reason, evidence and revisit condition")
        key = row["finding_id"]
        if not HEX.fullmatch(key) or key in result:
            raise ValueError("invalid or duplicate finding ID")
        if row["decision"] not in {"reviewed-correction", "reviewed-refactor", "contract-change",
                                   "environment", "historical-debt", "exception"} or not HTTPS.fullmatch(row["evidence"]):
            raise ValueError("invalid decision or missing evidence URL")
        if (row["decision"] == "exception") != ("expires" in row):
            raise ValueError("exceptions require an expiry")
        record = dict(row)
        if "expires" in row:
            expires = date.fromisoformat(row["expires"])
            if expires.isoformat() != row["expires"]:
                raise ValueError("expected YYYY-MM-DD")
            record["expired"] = expires <= today
        result[key] = record
    return result


def register_findings(findings: list[dict], before: dict, proposed: dict, counts: Counter) -> None:
    for finding in findings:
        path = finding["base_path"] or finding["head_path"]
        evidence = finding.pop("_evidence", "")
        group = finding["signal"], path, finding["test"], evidence
        counts[group] += 1
        key = identity(*group, counts[group])
        finding["finding_id"] = key
        finding["review_status"] = "new"
        existing = before.get(key)
        if existing and existing["path"] == path:
            finding["review_status"] = (
                "expired-exception" if existing.get("expired") else "base-" + existing["decision"])
        pending = proposed.get(key)
        if pending and pending != existing and pending["path"] == path:
            finding["proposed_disposition"] = pending["decision"]
