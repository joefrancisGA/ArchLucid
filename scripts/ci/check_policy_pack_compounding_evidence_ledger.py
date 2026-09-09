#!/usr/bin/env python3
"""TB-885: compounding-evidence ledger must stay honest and fixture-backed."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from write_policy_pack_compounding_evidence_ledger import (  # noqa: E402
    CLAIM_BOUNDARY,
    FIXTURE_REL,
    SCHEMA,
    build_packet,
    repo_root,
)

_LEDGER_JSON = "docs/quality/policy-pack-compounding-evidence-ledger.json"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    fixture_path = root / FIXTURE_REL

    if not fixture_path.is_file():
        errors.append(f"missing fixture: {FIXTURE_REL}")
        fixture = {}
    else:
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))

    try:
        packet = build_packet(root)
    except (FileNotFoundError, json.JSONDecodeError, KeyError) as ex:
        print(f"failed to build compounding ledger packet: {ex}", file=sys.stderr)
        return 1

    if packet["schema"] != SCHEMA:
        errors.append(f"unexpected schema: {packet['schema']}")

    if CLAIM_BOUNDARY not in packet["claimBoundaryText"]:
        errors.append("claim boundary must state this is not a buyer compounding rate")

    catch = packet["incrementalCatch"]

    if fixture:
        if catch["gateBlockedFlipped"] != fixture.get("gateBlockedFlipped"):
            errors.append("gateBlockedFlipped must match fixture")

        added_key = fixture.get("addedComplianceRuleKey")

        if added_key and added_key not in catch["addedComplianceRuleKeys"]:
            errors.append("addedComplianceRuleKey must appear in incrementalCatch")

        finding_id = fixture.get("incrementalCatchFindingId")

        if finding_id and finding_id not in catch["findingsNewlyBlockingCommit"]:
            errors.append("incrementalCatchFindingId must appear in incrementalCatch")

    ledger_path = root / _LEDGER_JSON

    if ledger_path.is_file():
        on_disk = json.loads(ledger_path.read_text(encoding="utf-8"))

        if on_disk.get("schema") != SCHEMA:
            errors.append(f"{_LEDGER_JSON}: unexpected schema")

        if on_disk.get("runId") != packet["runId"]:
            errors.append(f"{_LEDGER_JSON}: runId drift vs fixture")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_policy_pack_compounding_evidence_ledger: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
