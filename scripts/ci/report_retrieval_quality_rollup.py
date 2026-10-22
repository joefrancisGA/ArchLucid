#!/usr/bin/env python3
"""Combined retrieval-quality rollup for first-pilot proof (IR + faithfulness)."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _parse_ir_metrics(text: str) -> dict[str, float | int | None]:
    recall = mrr = None
    cases = None

    if m := re.search(r"\*\*Cases evaluated:\*\*\s+(\d+)", text):
        cases = int(m.group(1))

    if m := re.search(r"Mean recall@5:\*\*\s+([0-9.]+)", text):
        recall = float(m.group(1))

    if m := re.search(r"Mean MRR:\*\*\s+([0-9.]+)", text):
        mrr = float(m.group(1))

    return {"casesEvaluated": cases, "meanRecallAt5": recall, "meanMrr": mrr}


def _parse_faithfulness_metrics(text: str) -> dict[str, float | int | None]:
    support = cases = None

    if m := re.search(r"Mean support ratio:\*\*\s+([0-9.]+)", text):
        support = float(m.group(1))

    if m := re.search(r"\*\*Cases evaluated:\*\*\s+(\d+)", text):
        cases = int(m.group(1))

    return {"casesEvaluated": cases, "meanSupportRatio": support}


def _ensure_faithfulness_report(root: Path) -> Path:
    report = root / "docs" / "quality" / "faithfulness-report.md"

    if report.is_file():
        return report

    script = root / "scripts" / "ci" / "eval_agent_faithfulness.py"

    if script.is_file():
        subprocess.run([sys.executable, str(script)], cwd=root, check=False)

    return report


def build_summary(root: Path) -> dict[str, object]:
    ir_report = root / "docs" / "quality" / "retrieval-ir-report.md"
    ir_json = root / "docs" / "quality" / "retrieval-ir-summary.json"
    faith_report = _ensure_faithfulness_report(root)

    ir_status = "not-collected"
    faith_status = "not-collected"
    ir_metrics: dict[str, object] = {}
    faith_metrics: dict[str, object] = {}

    if ir_report.is_file():
        ir_status = "present"
        ir_metrics = _parse_ir_metrics(ir_report.read_text(encoding="utf-8"))

        if ir_json.is_file():
            ir_metrics["summaryJsonPresent"] = True

    if faith_report.is_file():
        faith_status = "present"
        faith_metrics = _parse_faithfulness_metrics(faith_report.read_text(encoding="utf-8"))

    evaluated = ir_status == "present" or faith_status == "present"
    skipped = not evaluated
    failed = False

    if ir_status == "present" and ir_metrics.get("meanRecallAt5") is not None:
        if float(ir_metrics["meanRecallAt5"]) < 0.85:
            failed = True

    disposition = "NOT_COLLECTED"

    if skipped:
        disposition = "NOT_COLLECTED"
    elif failed:
        disposition = "FAIL"
    elif ir_status == "not-collected" or faith_status == "not-collected":
        disposition = "PARTIAL"
    else:
        disposition = "PASS"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "retrievalIrStatus": ir_status,
        "faithfulnessStatus": faith_status,
        "retrievalIr": ir_metrics,
        "faithfulness": faith_metrics,
        "interpretation": (
            "Offline golden-fixture benchmarks only — not live customer corpus measurements."
        ),
    }


def render_markdown(summary: dict[str, object]) -> str:
    ir = summary.get("retrievalIr") or {}
    faith = summary.get("faithfulness") or {}
    lines = [
        "# Retrieval quality rollup (pilot proof)",
        "",
        "> Combined offline retrieval IR and agent faithfulness evidence. No raw prompts or customer text.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{summary.get('disposition')}** |",
        f"| Retrieval IR | **{summary.get('retrievalIrStatus')}** |",
        f"| Faithfulness | **{summary.get('faithfulnessStatus')}** |",
        f"| Mean recall@5 | {ir.get('meanRecallAt5', 'n/a')} |",
        f"| Mean MRR | {ir.get('meanMrr', 'n/a')} |",
        f"| Mean support ratio | {faith.get('meanSupportRatio', 'n/a')} |",
        "",
        str(summary.get("interpretation")),
        "",
    ]
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    summary = build_summary(root)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    disposition = str(summary.get("disposition"))

    if disposition == "FAIL":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
