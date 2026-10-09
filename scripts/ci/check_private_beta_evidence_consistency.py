#!/usr/bin/env python3
"""Validate that private-beta evidence records belong to one release cut."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

COMMIT_KEYS = ("gitCommitSha", "commitSha", "headSha", "workflowCommitSha")


def _non_empty_string(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()

    return None


def _collect_commit_shas(value: Any) -> set[str]:
    shas: set[str] = set()

    if isinstance(value, dict):
        for key in COMMIT_KEYS:
            commit_sha = _non_empty_string(value.get(key))

            if commit_sha is not None:
                shas.add(commit_sha)

        for nested in value.values():
            shas.update(_collect_commit_shas(nested))

    elif isinstance(value, list):
        for nested in value:
            shas.update(_collect_commit_shas(nested))

    return shas


def _collect_run_ids(payload: dict[str, Any]) -> tuple[list[str], list[str]]:
    requested = [
        run_id.strip()
        for run_id in payload.get("requestedRunIds", [])
        if isinstance(run_id, str) and run_id.strip()
    ]
    records = [
        str(record.get("runId")).strip()
        for record in payload.get("records", [])
        if isinstance(record, dict) and _non_empty_string(record.get("runId")) is not None
    ]

    return requested, records


def collect_violations(
    payloads: list[dict[str, Any]],
    *,
    expected_commit_sha: str | None = None,
) -> list[str]:
    violations: list[str] = []
    commit_shas: set[str] = set()
    requested_run_ids: list[str] = []
    record_run_ids: list[str] = []

    for payload in payloads:
        commit_shas.update(_collect_commit_shas(payload))
        requested, records = _collect_run_ids(payload)
        requested_run_ids.extend(requested)
        record_run_ids.extend(records)

    if len(commit_shas) > 1:
        violations.append(
            f"evidence contains multiple commit SHAs: {', '.join(sorted(commit_shas))}"
        )

    normalized_expected_sha = _non_empty_string(expected_commit_sha)

    if normalized_expected_sha is not None:
        if not commit_shas:
            violations.append("expected commit SHA was supplied but evidence has none")
        elif commit_shas != {normalized_expected_sha}:
            violations.append(
                f"evidence commit SHA does not match expected {normalized_expected_sha}"
            )

    duplicate_requested = sorted(
        {run_id for run_id in requested_run_ids if requested_run_ids.count(run_id) > 1}
    )
    if duplicate_requested:
        violations.append(f"duplicate requested run IDs: {', '.join(duplicate_requested)}")

    duplicate_records = sorted(
        {run_id for run_id in record_run_ids if record_run_ids.count(run_id) > 1}
    )
    if duplicate_records:
        violations.append(f"duplicate evidence run IDs: {', '.join(duplicate_records)}")

    missing_records = sorted(set(requested_run_ids) - set(record_run_ids))
    if missing_records:
        violations.append(
            f"requested run IDs have no evidence records: {', '.join(missing_records)}"
        )

    return violations


def _load_payload(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a JSON object")

    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="append", dest="json_paths", required=True)
    parser.add_argument("--expected-commit-sha")
    args = parser.parse_args()

    try:
        payloads = [_load_payload(Path(path).resolve()) for path in args.json_paths]
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    violations = collect_violations(
        payloads,
        expected_commit_sha=args.expected_commit_sha,
    )

    if violations:
        for violation in violations:
            print(f"ERROR: {violation}")

        return 1

    print("Private-beta evidence consistency: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
