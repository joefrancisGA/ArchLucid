#!/usr/bin/env python3
"""Partition exact .NET Category=Slow SQL discovery into complementary diagnostic halves."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


def discovered_ids(path: Path) -> list[str]:
    ids = [line.strip() for line in path.read_text().splitlines()
           if line.startswith("    ArchLucid.Api.Tests.")]
    if len(ids) < 2 or len(ids) != len(set(ids)):
        raise ValueError(f"Expected unique Slow SQL test IDs; discovered {len(ids)}, unique {len(set(ids))}")
    for test_id in ids:
        method = test_id.split("(", 1)[0]
        if not re.fullmatch(r"[A-Za-z0-9_.+`]+", method):
            raise ValueError(f"Unsafe or malformed filter test ID: {test_id}")
    return sorted(ids)


def prepare(args: argparse.Namespace) -> None:
    destination = Path(args.output)
    destination.mkdir(parents=True, exist_ok=True)
    ids = discovered_ids(Path(args.discovery))
    methods = sorted({test_id.split("(", 1)[0] for test_id in ids})
    middle = (len(methods) + 1) // 2
    halves = (methods[:middle], methods[middle:])
    if not halves[0] or not halves[1] or set(halves[0]) & set(halves[1]):
        raise ValueError("Cannot split Slow SQL methods into disjoint nonempty complementary halves")
    selected = halves[args.half]
    selected_set = set(selected)
    expected = [test_id for test_id in ids if test_id.split("(", 1)[0] in selected_set]
    other_set = set(halves[1 - args.half])
    other_count = sum(test_id.split("(", 1)[0] in other_set for test_id in ids)
    if len(expected) + other_count != len(ids):
        raise ValueError("Subsets are not a complete partition of discovered test IDs")
    filter_text = "Category=Slow&(" + "|".join(
        "FullyQualifiedName=" + method for method in selected) + ")"
    (destination / "filter.txt").write_text(filter_text)
    (destination / "expected-test-ids.txt").write_text("\n".join(expected) + "\n")
    (destination / "all-discovered-test-ids.txt").write_text("\n".join(ids) + "\n")
    metadata = {
        "sha": args.sha,
        "half": args.half,
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "test_count_all": len(ids),
        "method_count_all": len(methods),
        "test_count_subset": len(expected),
        "method_count_subset": len(selected),
        "discovery_sha256": hashlib.sha256("\n".join(ids).encode()).hexdigest(),
        "filter_sha256": hashlib.sha256(filter_text.encode()).hexdigest(),
        "selected_methods": selected,
        "expected_test_ids": expected,
    }
    (destination / "partition-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"RC46 SHA {args.sha}: half {args.half}, {len(expected)}/{len(ids)} test IDs, {len(selected)}/{len(methods)} methods")


def verify(args: argparse.Namespace) -> None:
    destination = Path(args.output)
    expected = Counter((destination / "expected-test-ids.txt").read_text().splitlines())
    trx = destination / "subset.trx"
    if not trx.is_file():
        raise ValueError("Missing subset TRX; subset execution is UNVERIFIED")
    root = ET.parse(trx).getroot()
    tests = list(root.findall(".//{*}UnitTestResult"))
    observed = Counter(test.attrib.get("testName", "") for test in tests)
    outcomes = Counter(test.attrib.get("outcome", "UNKNOWN") for test in tests)
    (destination / "observed-test-ids.txt").write_text("\n".join(sorted(observed.elements())) + "\n")
    result = {
        "expected_count": sum(expected.values()),
        "observed_count": sum(observed.values()),
        "missing": sorted((expected - observed).elements()),
        "unexpected": sorted((observed - expected).elements()),
        "outcomes": dict(outcomes),
    }
    (destination / "partition-verification.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    if result["missing"] or result["unexpected"] or outcomes.get("NotExecuted"):
        raise ValueError("Subset did not execute exactly its expected IDs; no acceptance can be claimed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=("prepare", "verify"))
    parser.add_argument("--output", required=True)
    parser.add_argument("--discovery")
    parser.add_argument("--half", type=int, choices=(0, 1))
    parser.add_argument("--sha")
    args = parser.parse_args()
    if args.operation == "prepare":
        if args.discovery is None or args.half is None or args.sha is None:
            parser.error("prepare requires --discovery, --half and --sha")
        prepare(args)
    else:
        verify(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"RC46 SQL partition diagnostic error: {exc}", file=sys.stderr)
        sys.exit(1)
