#!/usr/bin/env python3
"""Read-only, privacy-safe pricing quote cohort and duplicate-signal report.

Uses the existing quote export contract. Never emits names, IDs, emails, freeform
notes or domain names, and never mutates a lead or contacts anyone.
"""
from __future__ import annotations
import argparse
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

try:
    from scripts.ci.pricing_quote_response_telemetry import load_records_from_export, parse_datetime
except ModuleNotFoundError:
    from pricing_quote_response_telemetry import load_records_from_export, parse_datetime

def build(payload: dict, *, as_of: datetime) -> dict:
    if not isinstance(payload, dict) or payload.get("schema") != "archlucid.pricing-quote-requests-export.v1":
        raise ValueError("Wrong quote export schema")
    # The shared loader ignores non-object rows. Reject them here so a broken
    # export cannot silently undercount leads or fabricate a healthy cohort.
    rows = payload.get("rows")
    if not isinstance(rows, list) or len(rows) > 100_000 or any(
            not isinstance(row, dict) for row in rows):
        raise ValueError("Invalid or oversized quote export rows")
    if as_of.tzinfo is None or as_of.utcoffset() is None:
        raise ValueError("Snapshot timestamp must include a timezone")
    as_of = as_of.astimezone(timezone.utc)
    try:
        records = load_records_from_export(payload)
    except (ValueError, TypeError, OverflowError):
        # Bad timestamps can contain user-supplied text. Never echo them into
        # console errors or CI logs, even when the input is untrusted.
        raise ValueError("Invalid quote export record") from None
    if not records:
        return {"status": "NO_RECORDS", "recordCount": 0, "potentialDuplicateGroups": 0,
                "unansweredByAge": {"0_18h": 0, "18_24h": 0, "24_72h": 0, "72h_plus": 0},
                "closedCount": 0, "disposition": "INSUFFICIENT_EVIDENCE"}
    identity_counts = Counter()
    ages = dict.fromkeys(("0_18h", "18_24h", "24_72h", "72h_plus"), 0)
    closed = 0
    seen_request_ids = set()
    for row in records:
        # An export repeating a single DB row is not evidence of two leads.
        # IDs are never placed in the aggregate output.
        normalized_id = row.id.casefold()
        if normalized_id in seen_request_ids:
            raise ValueError("Duplicate quote request ID in export")
        seen_request_ids.add(normalized_id)
        if row.created_utc > as_of:
            raise ValueError("Future-dated quote request in snapshot")
        # A future "first response" falsely removes an overdue lead from aging;
        # a backdated response/closure can make an SLA appear faster than truth.
        for event_at in (row.first_response_utc, row.closed_utc):
            if event_at is not None and not (row.created_utc <= event_at <= as_of):
                raise ValueError("Quote event timestamp outside snapshot window")
        # Compute only in memory; do not store stable hashes of personal data.
        identity = (row.work_email.strip().casefold(), row.company_name.strip().casefold())
        if all(identity):
            identity_counts[identity] += 1
        if row.status.strip().lower() == "closed":
            closed += 1
        if row.first_response_utc is None and row.status.strip().lower() != "closed":
            hours = (as_of - row.created_utc).total_seconds() / 3600
            band = "0_18h" if hours < 18 else "18_24h" if hours < 24 else "24_72h" if hours < 72 else "72h_plus"
            ages[band] += 1
    return {
        "schemaVersion": 1, "status": "AGGREGATED_NO_PII",
        "recordCount": len(records), "closedCount": closed,
        "openCount": len(records) - closed,
        "potentialDuplicateGroups": sum(count > 1 for count in identity_counts.values()),
        "duplicateRecordExcess": sum(count-1 for count in identity_counts.values() if count > 1),
        "unansweredByAge": ages,
        "disposition": "REVIEW" if ages["24_72h"] or ages["72h_plus"] else "MONITOR",
        "limitations": "Same normalized company+email is only a candidate duplicate. No automatic merging, contact or closure.",
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--as-of", required=True)
    p.add_argument("--output", type=Path, required=True)
    a=p.parse_args()
    if not a.input.is_file() or a.input.stat().st_size > 20_000_000:
        raise ValueError("Missing or oversized quote export")
    anchor = parse_datetime(a.as_of)
    if anchor is None:
        raise ValueError("Expected as-of timestamp")
    report=build(json.loads(a.input.read_text(encoding="utf-8")), as_of=anchor)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("Quote cohort: " + report["status"] + "; no customer data exported")

if __name__=="__main__":
    main()
