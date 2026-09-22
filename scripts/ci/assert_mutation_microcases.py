#!/usr/bin/env python3
"""Verify mutation microcase corpus floors and canonical mutation IDs (TB-2352 lift)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST_PATH = REPO_ROOT / "tests" / "eval-corpus" / "mutation-microcases.json"

CANONICAL_MUTATION_IDS = (
    "mutate-rto-30m",
    "mutate-add-replication",
    "mutate-remove-trust-boundary",
    "mutate-data-regulated",
    "mutate-add-authentication",
    "mutate-remove-replication",
    "mutate-remove-rto",
    "mutate-add-public-api",
    "mutate-tighten-rpo",
    "mutate-add-unowned-service",
    "mutate-add-private-endpoint",
)


def _load_json(path: Path) -> dict:
    document = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(document, dict):
        raise ValueError(f"{path}: root must be an object")

    return document


def verify_manifest(path: Path) -> list[str]:
    failures: list[str] = []

    if not path.is_file():
        return [f"Missing mutation microcases manifest {path}"]

    document = _load_json(path)
    minimum_case_count = document.get("minimumCaseCount")

    if not isinstance(minimum_case_count, int) or minimum_case_count < 1:
        failures.append(f"{path}: minimumCaseCount positive integer required")

    cases = document.get("cases")

    if not isinstance(cases, list) or not cases:
        failures.append(f"{path}: cases[] required")
        return failures

    if isinstance(minimum_case_count, int) and len(cases) < minimum_case_count:
        failures.append(
            f"{path}: expected at least {minimum_case_count} mutation microcase(s), found {len(cases)}",
        )

    seen_ids: set[str] = set()

    for index, case in enumerate(cases):
        if not isinstance(case, dict):
            failures.append(f"{path}: cases[{index}] must be an object")
            continue

        mutation_id = case.get("mutationId")
        apply_delta = case.get("applyDelta")
        expect_changed = case.get("expectChangedFindings")

        if not isinstance(mutation_id, str) or not mutation_id.strip():
            failures.append(f"{path}: cases[{index}].mutationId string required")
            continue

        mutation_id = mutation_id.strip()

        if mutation_id in seen_ids:
            failures.append(f"{path}: duplicate mutationId {mutation_id!r}")
        else:
            seen_ids.add(mutation_id)

        if not isinstance(apply_delta, str) or not apply_delta.strip():
            failures.append(f"{path}: cases[{index}].applyDelta string required for {mutation_id!r}")

        if expect_changed is not True:
            failures.append(
                f"{path}: cases[{index}].expectChangedFindings must be true for {mutation_id!r}",
            )

    for mutation_id in CANONICAL_MUTATION_IDS:
        if mutation_id not in seen_ids:
            failures.append(f"{path}: missing canonical mutationId {mutation_id!r}")

    extra_ids = sorted(seen_ids.difference(CANONICAL_MUTATION_IDS))

    if extra_ids:
        failures.append(f"{path}: unexpected mutationId(s) not in canonical set: {', '.join(extra_ids)}")

    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--manifest-path",
        type=Path,
        default=DEFAULT_MANIFEST_PATH,
        help="Path to mutation-microcases.json",
    )
    args = parser.parse_args()

    manifest_path = args.manifest_path.resolve()
    failures = verify_manifest(manifest_path)

    if failures:
        for message in failures:
            print(f"::error::{message}")
        return 1

    document = _load_json(manifest_path)
    case_count = len(document.get("cases") or [])
    print(f"Mutation microcases: verified {case_count} canonical case(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
