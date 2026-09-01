#!/usr/bin/env python3
"""WK-12: offline finding-delta packet must stay honest and SE-runnable without an API."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from write_policy_pack_finding_delta_offline_packet import (
    CIS_REL,
    FINOPS_REL,
    SOC2_REL,
    build_packet,
    repo_root,
)

_DEMO_SCRIPT = "scripts/demo-policy-pack-delta.ps1"
_DEMO_DOC = "docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []
    packet = build_packet(root)

    if packet["onlyInSoc2Count"] < 1 or packet["onlyInCisAzureCount"] < 1:
        errors.append("SOC 2 vs CIS Azure sample packs must differ in complianceRuleKeys")

    cis_extras = packet["cisAzure"]["advisoryExtras"]
    finops_extras = packet["finOps"]["advisoryExtras"]

    if cis_extras.get("expectation.topologyCategories.add") != "identity":
        errors.append(f"{CIS_REL}: missing identity topology extra")

    if finops_extras.get("cost.requireBudgetCap") != "true":
        errors.append(f"{FINOPS_REL}: missing cost.requireBudgetCap extra")

    if "identity" in json.dumps(packet["soc2"]["advisoryExtras"]):
        errors.append(f"{SOC2_REL}: must not stamp topology identity (honesty)")

    demo_script = (root / _DEMO_SCRIPT).read_text(encoding="utf-8", errors="replace")

    if "OfflineFindingDelta" not in demo_script:
        errors.append(f"{_DEMO_SCRIPT}: missing -OfflineFindingDelta switch")

    demo_doc = (root / _DEMO_DOC).read_text(encoding="utf-8", errors="replace")

    if "OfflineFindingDelta" not in demo_doc:
        errors.append(f"{_DEMO_DOC}: missing OfflineFindingDelta SE path")

    if "cost.requireBudgetCap" not in demo_doc:
        errors.append(f"{_DEMO_DOC}: missing FinOps overlay extra talk track")

    for relative in (SOC2_REL, CIS_REL, FINOPS_REL):
        if not (root / relative).is_file():
            errors.append(f"missing sample pack: {relative}")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_policy_pack_finding_delta_offline_packet: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
