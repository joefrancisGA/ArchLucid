#!/usr/bin/env python3
"""Render tier-fit matrix Markdown for first-pilot proof bundles (TB-132)."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

MATRIX_SOURCE = Path(__file__).resolve().parent / "data" / "tier_fit_validation_matrix.v1.json"


def render_markdown(matrix: dict[str, object]) -> str:
    lines = [
        "# Tier fit validation matrix",
        "",
        "> Machine-readable source: `tier-fit-validation-matrix.json` in this proof folder.",
        "",
        "| Tier | Buyer job | Included proof outputs | Excluded / deferred |",
        "| --- | --- | --- | --- |",
    ]

    for tier in matrix.get("tiers") or []:
        if not isinstance(tier, dict):
            continue

        outputs = "; ".join(str(item) for item in (tier.get("includedProofOutputs") or []))
        excluded = "; ".join(str(item) for item in (tier.get("excludedOrDeferred") or []))

        lines.append(
            "| "
            + " | ".join(
                [
                    str(tier.get("displayName", "")),
                    str(tier.get("buyerJob", "")).replace("|", "/"),
                    outputs.replace("|", "/"),
                    excluded.replace("|", "/"),
                ],
            )
            + " |",
        )

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args()

    matrix = json.loads(MATRIX_SOURCE.read_text(encoding="utf-8"))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(MATRIX_SOURCE, args.json_out)
    args.markdown_out.write_text(render_markdown(matrix), encoding="utf-8")
    print("OK: tier fit matrix summary written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
