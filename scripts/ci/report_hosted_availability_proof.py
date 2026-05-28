#!/usr/bin/env python3
"""Attach hosted SaaS probe availability rollup to first-pilot proof when artifacts exist."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def _load_summarize_module():
    repo_root = Path(__file__).resolve().parents[2]
    script = repo_root / "scripts" / "ops" / "summarize_hosted_probe_artifacts.py"
    spec = importlib.util.spec_from_file_location("summarize_hosted_probe_artifacts", script)
    module = importlib.util.module_from_spec(spec)

    if spec.loader is None:
        raise RuntimeError("loader missing")

    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser(description="Render hosted availability rollup proof artifact.")
    parser.add_argument(
        "probe_paths",
        nargs="*",
        type=Path,
        help="probe-result.json files and/or directories (optional)",
    )
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    summarize = _load_summarize_module()
    paths = [path.expanduser().resolve() for path in args.probe_paths]

    if not paths:
        summary = {
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "disposition": "NOT_COLLECTED",
            "environmentLabel": "unknown",
            "probeArtifactCount": 0,
            "message": "No hosted probe artifacts supplied; this is informational unless production-like proof profile requires it.",
        }
        markdown = "\n".join(
            [
                "# Hosted availability rollup (proof)",
                "",
                "| Field | Value |",
                "| --- | --- |",
                "| Disposition | **NOT_COLLECTED** |",
                "",
                "No hosted-saas-probe artifacts were attached. Staging probe history does **not** imply production SLA evidence.",
                "",
                "See `docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md`.",
                "",
            ]
        )
    else:
        rows = summarize.load_rows_from_json_paths(paths)
        model = summarize.build_rollup(rows)
        markdown = summarize.render_markdown(model)
        summary = {
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "disposition": "COLLECTED",
            "environmentLabel": model.environment_label,
            "probeArtifactCount": len(rows),
            "attemptedCount": model.attempted_count,
            "bothOkCount": model.both_ok_count,
            "uptimePercentOfAttempted": model.uptime_percent_of_attempted,
            "caveat": "Staging/hosted HTTP probes only — not contractual SLA evidence.",
        }

    markdown_path = args.markdown_out.expanduser().resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")

    if args.json_summary_out is not None:
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"hosted availability proof: {summary['disposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
