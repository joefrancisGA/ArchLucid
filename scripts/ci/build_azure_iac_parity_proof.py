#!/usr/bin/env python3
"""Emit azure-iac-parity-proof.json/.md for RC release evidence bundles."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from report_iac_parity_scan import build_report, render_markdown, repo_root  # noqa: E402

_SCHEMA = "archlucid.azure-iac-parity-proof.v1"


def build_proof(root: Path) -> dict[str, object]:
    scan = build_report(root)

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": scan.get("disposition"),
        "scanSchema": scan.get("schema"),
        "rows": scan.get("rows"),
        "notes": scan.get("notes"),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--strict-rc", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    proof = build_proof(args.repo_root.resolve())
    scan_for_md = {
        "generatedUtc": proof["generatedUtc"],
        "disposition": proof["disposition"],
        "rows": proof["rows"],
        "notes": proof["notes"],
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(
        "# Azure IaC parity proof\n\n" + render_markdown(scan_for_md).split("\n", 1)[1],
        encoding="utf-8",
    )

    if args.strict_rc and proof.get("disposition") == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
