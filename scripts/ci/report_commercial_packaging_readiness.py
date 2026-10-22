#!/usr/bin/env python3
"""Commercial packaging readiness rollup (pricing single-source + tier drift)."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _run_check(root: Path, script: str) -> tuple[int, str]:
    path = root / script

    if not path.is_file():
        return 2, f"missing {script}"

    proc = subprocess.run(
        [sys.executable, str(path)],
        cwd=root,
        capture_output=True,
        text=True,
    )
    output = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, output.strip()


def build_summary(root: Path) -> dict[str, object]:
    checks: list[dict[str, object]] = []

    for script, label in (
        ("scripts/ci/check_pricing_single_source.py", "pricing-single-source"),
        ("scripts/ci/assert_commercial_tier_packaging_drift.py", "commercial-tier-drift"),
    ):
        code, output = _run_check(root, script)
        checks.append({"name": label, "exitCode": code, "outputTail": output[-500:] if output else ""})

    failed = [c for c in checks if c["exitCode"] != 0]
    disposition = "PASS" if not failed else "BLOCK"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "liveCommerceDeferred": True,
        "checks": checks,
        "notes": [
            "Sales-led V1: quote and order-form paths remain manual.",
            "Live Stripe/Marketplace checkout stays owner-controlled until un-hold.",
        ],
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Commercial packaging readiness",
        "",
        f"**Disposition:** {summary.get('disposition')}",
        "",
        "| Check | Exit code |",
        "| --- | --- |",
    ]

    for row in summary.get("checks", []):
        if isinstance(row, dict):
            lines.append(f"| {row.get('name')} | {row.get('exitCode')} |")

    lines.extend(["", "## Notes", ""])

    for note in summary.get("notes", []):
        lines.append(f"- {note}")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    summary = build_summary(root)
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0 if summary.get("disposition") == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
