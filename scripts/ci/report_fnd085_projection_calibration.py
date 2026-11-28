#!/usr/bin/env python3
"""Summarize closed FND-085 shadow cohorts against measured provider economics."""
import argparse
from decimal import Decimal, DecimalException
import json
from pathlib import Path

GIB = Decimal(1024**3)
MAX_INPUT_BYTES = 8 * 1024 * 1024


def decimal_field(source, name):
    value = source[name]
    if isinstance(value, bool) or not isinstance(value, (int, Decimal)):
        raise ValueError(f"{name} must be a number")
    value = Decimal(value)
    if not value.is_finite() or value < 0 or value > Decimal("1e12"):
        raise ValueError(f"{name} must be finite and nonnegative")
    return value


def int_field(source, name, minimum, maximum):
    value = source[name]
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError(f"{name} is outside the supported bounds")
    return value


def identity(source, name):
    value = source[name]
    if not isinstance(value, str) or not value.strip() or len(value) > 256:
        raise ValueError(f"{name} is missing or invalid")
    return value


def calibrate(source):
    if int_field(source, "schema", 1, 1) != 1 or int_field(source, "windowSeconds", 3600, 3600) != 3600:
        raise ValueError("unsupported evidence format or retention window")

    provider = identity(source, "provider")
    currency = identity(source, "currency")
    priced_from = identity(source, "providerEvidence")
    encoding = identity(source, "storageEncoding")
    if encoding not in {"binary", "base64"}:
        raise ValueError("storageEncoding must be binary or base64")

    minimum = int_field(source, "minNodes", 2048, 8192)
    maximum = int_field(source, "maxNodes", minimum, 8192)
    dropped = int_field(source, "droppedObservations", 0, 2**31 - 1)
    rows = source["cohorts"]
    if not isinstance(rows, list) or len(rows) > 10_000:
        raise ValueError("cohorts must be a bounded list")
    if not rows:
        return {"status": "NOT_MEASURED", "reason": "no_complete_cohorts"}

    hits, billed_bytes = 0, 0
    seen = set()
    for row in rows:
        sample = identity(row, "eventId")
        if sample in seen:
            raise ValueError("duplicate observation event")
        seen.add(sample)
        int_field(row, "nodes", minimum, maximum)
        hits += int_field(row, "repeats", 0, 2**31 - 1)
        size = int_field(row, "binaryBytes", 1, 4 * 1024 * 1024)
        billed_bytes += 4 * ((size + 2) // 3) if encoding == "base64" else size

    write = decimal_field(source, "encodeWriteCostPerArtifact")
    read = decimal_field(source, "validateReadCostPerHit")
    recompute = decimal_field(source, "recomputeCostPerHit")
    retention_rate = decimal_field(source, "retentionCostPerGiBHour")
    hours = max(Decimal(1), decimal_field(source, "minimumBillableHours"))
    if recompute <= 0:
        raise ValueError("recompute cost must be positive and priced")
    retention = Decimal(billed_bytes) / GIB * hours * retention_rate
    storage = len(rows) * write + hits * read + retention
    recomputing = hits * recompute
    net = recomputing - storage
    status = "INCOMPLETE" if dropped else ("CANDIDATE_FOR_REVIEW" if net > 0 else "RECOMPUTE")
    return {
        "status": status,
        "provider": provider,
        "currency": currency,
        "providerEvidence": priced_from,
        "completeCohorts": len(rows),
        "droppedObservations": dropped,
        "observedRepeatOpportunities": hits,
        "meanOpportunitiesPerCohort": str(Decimal(hits) / len(rows)),
        "storageCost": str(storage),
        "retentionCost": str(retention),
        "recomputationCost": str(recomputing),
        "estimatedNetSavings": str(net),
        "limitation": "Sampled same-process repeats only. Review representative coverage and adoption separately. No write authorization.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    args = parser.parse_args()
    try:
        with args.input.open("rb") as evidence:
            raw = evidence.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            raise ValueError("evidence exceeds the input limit")
        result = calibrate(json.loads(raw, parse_float=Decimal))
    except (OSError, KeyError, TypeError, ValueError, DecimalException) as ex:
        print(json.dumps({"status": "INVALID", "error": str(ex)}, indent=2))
        return 2
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
