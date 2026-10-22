"""Write M-49 faithfulness rollup scaffold + harness manifest (shared by ps1 and CI smoke)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def write_scaffold(output_directory: Path, run_ids: list[str], *, base_url: str = "http://localhost:5128") -> dict[str, object]:
    if len(run_ids) < 1:
        raise ValueError("At least one run id is required.")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    harness_dir = output_directory / f"m49-harness-{timestamp}"
    harness_dir.mkdir(parents=True, exist_ok=True)

    rollup_path = harness_dir / "real-mode-faithfulness-rollup.md"
    manifest_path = harness_dir / "harness-manifest.json"

    rollup_lines = [
        "# Real-mode faithfulness rollup (M-49 harness output)",
        "",
        f"Generated: {timestamp} UTC",
        f"Harness directory: {harness_dir}",
        "Canonical gate: docs/quality/REAL_MODE_FAITHFULNESS_ROLLUP.md",
        "",
        "> **Owner action required:** Replace placeholder cells with human-counted faithfulness scores from authorized real-mode runs only.",
        "",
        "## Cohort rollup",
        "",
        "| Run id | Mode | Packet | Findings | Evidence-chain % | Unsupported | Wrong/overstated | Support ratio | Disposition | BLOCK rows |",
        "|--------|------|--------|---------:|-----------------:|------------:|-----------------:|--------------:|-------------|-----------:|",
    ]

    for run_id in run_ids:
        rollup_lines.append(
            f"| `{run_id}` | Real | `<brief-id>` | — | — | — | — | — | — | — |"
        )

    rollup_lines.extend(
        [
            "",
            "## Cohort aggregates (complete after scoring)",
            "",
            f"- Admissible runs scored: `{len(run_ids)}` (target ≥3)",
            "- Total unsupported claims surviving to sponsor packet: `<sum>`",
            "- Total wrong / overstated findings on sponsor-sent items: `<sum>`",
            "- Min evidence-chain completeness on highest-severity finding: `<min %>`",
            "- Min retrieval support ratio where retrieval-backed: `<min>` (floor 0.80)",
            f"- Runs with READY or WARN disposition: `<k>` of `{len(run_ids)}`",
            "- Total BLOCK rows across cohort: `<sum>`",
            "- Real-mode evidence gate freshness: `<date>`",
            "",
            "## Sponsor-facing correctness gate",
            "",
            "**Verdict:** `HOLD` / `GOOD ENOUGH FOR SPONSOR-FACING PILOTS`",
            "**HOLD reason (if any):** run id(s) + failing condition number(s)",
            "",
            "## Proof collection folders",
            "",
            "- _(none — validate-only / proof collection skipped)_",
            "",
            "## Next steps",
            "",
            "1. Score each run using docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.",
            "2. Copy finalized rows into docs/quality/REAL_MODE_FAITHFULNESS_ROLLUP.md.",
            "3. Run ``.\\scripts\\Invoke-RealLlmEvidenceGate.ps1`` after run 3 or at RC.",
            "4. Attach outcome to artifacts/release/real-llm-evidence-gate.json per docs/quality/RELEASE_CLAIM_GATE.md.",
        ]
    )

    rollup_path.write_text("\n".join(rollup_lines) + "\n", encoding="utf-8")

    manifest: dict[str, object] = {
        "generatedUtc": timestamp,
        "harnessDir": str(harness_dir),
        "runIds": run_ids,
        "proofFolders": [],
        "rollupPath": str(rollup_path),
        "baseUrl": base_url,
        "aoaiConfigured": False,
        "validateOnly": True,
    }

    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return {
        "harnessDir": str(harness_dir),
        "rollupPath": str(rollup_path),
        "manifestPath": str(manifest_path),
        "runIds": run_ids,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--run-id", action="append", dest="run_ids", required=True)
    parser.add_argument("--base-url", default="http://localhost:5128")
    args = parser.parse_args(argv)

    result = write_scaffold(args.output_directory, args.run_ids, base_url=args.base_url)
    print(f"M-49 scaffold written: {result['rollupPath']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
