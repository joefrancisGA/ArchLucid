#!/usr/bin/env python3
"""Emit machine-readable quality gate promotion status for first-pilot proof."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


GATES: tuple[dict[str, str], ...] = (
    {
        "gate": "agent-eval-baseline",
        "currentMode": "WARN-local-CI-blocking-when-enabled",
        "promotionCriteria": "5 consecutive green main eval runs; false-positive budget < 2/quarter",
        "owner": "AI platform",
        "v1MergeBlocking": "conditional",
    },
    {
        "gate": "retrieval-ir",
        "currentMode": "WARN-in-proof",
        "promotionCriteria": "Stable green main + corpus change policy before blocking",
        "owner": "Retrieval",
        "v1MergeBlocking": "no",
    },
    {
        "gate": "route-tier-policy-nav",
        "currentMode": "BLOCK-on-sponsor-handoff",
        "promotionCriteria": "Already promoted for commercial surfaces",
        "owner": "Platform",
        "v1MergeBlocking": "yes-for-handoff",
    },
    {
        "gate": "mutating-route-audit-matrix",
        "currentMode": "BLOCK-in-CI",
        "promotionCriteria": "Already blocking in CI",
        "owner": "Platform",
        "v1MergeBlocking": "yes-in-ci",
    },
    {
        "gate": "reference-customer",
        "currentMode": "deferred-informational",
        "promotionCriteria": "Never V1 merge-blocking",
        "owner": "GTM",
        "v1MergeBlocking": "no",
    },
    {
        "gate": "soc2-cpa-pen-test",
        "currentMode": "deferred-informational",
        "promotionCriteria": "Never V1 merge-blocking",
        "owner": "Security",
        "v1MergeBlocking": "no",
    },
    {
        "gate": "live-marketplace-checkout",
        "currentMode": "owner-required",
        "promotionCriteria": "Never V1 merge-blocking",
        "owner": "Finance",
        "v1MergeBlocking": "no",
    },
)


def format_markdown(payload: dict[str, object]) -> str:
    lines = [
        "# Quality gate promotion status",
        "",
        "Canonical plan: [`QUALITY_GATE_PROMOTION_PLAN.md`](../library/QUALITY_GATE_PROMOTION_PLAN.md).",
        "",
        "| Gate | Mode | V1 merge-blocking | Owner |",
        "| --- | --- | --- | --- |",
    ]

    for row in payload.get("gates") or []:
        lines.append(
            f"| {row['gate']} | {row['currentMode']} | {row['v1MergeBlocking']} | {row['owner']} |",
        )

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    payload = {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "PASS",
        "gates": list(GATES),
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(format_markdown(payload), encoding="utf-8")
    print("quality gate promotion status: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
