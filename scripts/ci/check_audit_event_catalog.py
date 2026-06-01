#!/usr/bin/env python3
"""Validate audit event catalog metadata for critical commercial/proof workflows (TB-126)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = REPO_ROOT / "scripts" / "ci" / "data" / "audit_event_catalog.v1.json"
AUDIT_TYPES_PATH = REPO_ROOT / "ArchLucid.Core" / "Audit" / "AuditEventTypes.cs"
MATRIX_PATH = REPO_ROOT / "docs" / "library" / "AUDIT_COVERAGE_MATRIX.md"

REQUIRED_EVENT_KEYS = (
    "eventType",
    "owner",
    "purpose",
    "expectedActor",
    "buyerSafeSummary",
    "sensitivity",
    "exportPosture",
)

CRITICAL_EVENT_TYPES: frozenset[str] = frozenset(
    {
        "ManifestFinalized",
        "GovernanceApprovalRequested",
        "GovernanceDryRunRequested",
        "ExecutiveRoiBoardPackExported",
        "SponsorProofPackGenerated",
        "Marketing.PricingQuoteRequestAcknowledged",
        "SupportBundleDownloaded",
        "RunSubmitted",
        "RunCompleted",
    }
)


def load_catalog(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("catalog must be an object")

    return payload


def audit_event_constant_values(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    return set(re.findall(r'public const string \w+ = "([^"]+)";', text))


def catalog_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not CATALOG_PATH.is_file():
        return [f"missing catalog: {CATALOG_PATH.relative_to(root)}"]

    catalog = load_catalog(CATALOG_PATH)
    events = catalog.get("events")

    if not isinstance(events, list) or len(events) == 0:
        return ["audit_event_catalog.v1.json: events must be a non-empty array"]

    seen: set[str] = set()

    for index, entry in enumerate(events):
        if not isinstance(entry, dict):
            violations.append(f"catalog events[{index}] must be an object")
            continue

        for key in REQUIRED_EVENT_KEYS:
            value = entry.get(key)

            if not isinstance(value, str) or not value.strip():
                violations.append(f"catalog events[{index}] missing {key!r}")

        event_type = str(entry.get("eventType", "")).strip()

        if event_type:
            if event_type in seen:
                violations.append(f"duplicate catalog eventType {event_type!r}")
            else:
                seen.add(event_type)

    constant_values = audit_event_constant_values(AUDIT_TYPES_PATH)

    for event_type in CRITICAL_EVENT_TYPES:
        if event_type not in seen:
            violations.append(f"critical event {event_type!r} missing from catalog")

        if event_type not in constant_values:
            violations.append(f"critical event {event_type!r} not defined in AuditEventTypes.cs")

    if MATRIX_PATH.is_file():
        matrix_text = MATRIX_PATH.read_text(encoding="utf-8", errors="replace")

        for event_type in CRITICAL_EVENT_TYPES:
            if event_type not in matrix_text:
                violations.append(f"AUDIT_COVERAGE_MATRIX.md does not mention {event_type!r}")

    return violations


def main() -> int:
    violations = catalog_violations(REPO_ROOT)

    if violations:
        print("Audit event catalog FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Audit event catalog: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
