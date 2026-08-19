#!/usr/bin/env python3
"""Regenerate docs/quality/agent-quality-dashboard.md from committed quality artifacts.

Reads offline golden-cohort reports (faithfulness, retrieval IR), optional real-mode
evidence stubs, and eval manifest metadata. Does not call live Azure OpenAI.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _read_text(path: Path) -> str | None:
    if not path.is_file():
        return None

    return path.read_text(encoding="utf-8", errors="replace")


def _parse_faithfulness(text: str) -> dict[str, object]:
    cases = re.search(r"\*\*Cases evaluated:\*\*\s*(\d+)", text)
    positive_mean = re.search(r"\*\*Positive readiness support ratio:\*\*\s*([\d.]+)", text)
    negative_mean = re.search(r"\*\*Negative-control support ratio:\*\*\s*([\d.]+)", text)
    combined_mean = re.search(r"\*\*Combined diagnostic support ratio:\*\*\s*([\d.]+)", text)
    legacy_mean = re.search(r"\*\*Mean support ratio:\*\*\s*([\d.]+)", text)
    floor = re.search(r"\*\*Floor \(minSupportRatio\):\*\*\s*([\d.]+)", text)
    unsupported_roi = len(re.findall(r"unsupported-roi-cost", text, flags=re.IGNORECASE))

    parsed_positive = float(positive_mean.group(1)) if positive_mean else None
    parsed_negative = float(negative_mean.group(1)) if negative_mean else None
    parsed_combined = (
        float(combined_mean.group(1))
        if combined_mean
        else float(legacy_mean.group(1))
        if legacy_mean
        else None
    )

    return {
        "present": True,
        "casesEvaluated": int(cases.group(1)) if cases else None,
        "positiveSupportRatio": parsed_positive,
        "negativeSupportRatio": parsed_negative,
        "meanSupportRatio": parsed_combined,
        "floorMinSupportRatio": float(floor.group(1)) if floor else None,
        "unsupportedRoiCostRows": unsupported_roi,
        "evidenceMode": "deterministic-offline-fixtures",
    }


def _faithfulness_status(faith: dict[str, object]) -> str:
    positive = faith.get("positiveSupportRatio")
    negative = faith.get("negativeSupportRatio")
    floor = faith.get("floorMinSupportRatio")
    roi_rows = faith.get("unsupportedRoiCostRows", 0)

    if not isinstance(positive, float) or not isinstance(floor, float):
        combined = faith.get("meanSupportRatio")
        if isinstance(combined, float) and isinstance(floor, float) and combined >= floor:
            return "PASS"
        return "WARN"

    if positive < floor:
        return "WARN"

    if isinstance(negative, float) and negative > 0.35:
        return "WARN"

    if isinstance(roi_rows, int) and roi_rows > 0:
        return "WARN"

    return "PASS"


def _parse_retrieval_ir(text: str) -> dict[str, object]:
    cases = re.search(r"\*\*Cases evaluated:\*\*\s*(\d+)", text)
    recall = re.search(r"\*\*Mean recall@5:\*\*\s*([\d.]+)", text)
    mrr = re.search(r"\*\*Mean MRR:\*\*\s*([\d.]+)", text)

    return {
        "present": True,
        "casesEvaluated": int(cases.group(1)) if cases else None,
        "meanRecallAt5": float(recall.group(1)) if recall else None,
        "meanMrr": float(mrr.group(1)) if mrr else None,
        "evidenceMode": "deterministic-offline-fixtures",
    }


def _load_manifest_summary(root: Path) -> dict[str, object]:
    manifest_path = root / "tests" / "eval-datasets" / "manifest.json"

    if not manifest_path.is_file():
        return {"present": False}

    payload = json.loads(manifest_path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        return {"present": False}

    datasets = payload.get("datasets")

    return {
        "present": True,
        "schemaVersion": payload.get("schemaVersion"),
        "datasetCount": len(datasets) if isinstance(datasets, list) else 0,
    }


def _real_mode_section(root: Path) -> list[str]:
    template = root / "docs" / "quality" / "REAL_LLM_RUN_EVIDENCE_TEMPLATE.md"
    generated = root / "docs" / "quality" / "real-llm-run-evidence.md"
    dated = sorted(root.glob("docs/quality/REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_*.md"))

    lines: list[str] = []
    lines.append("## Real-mode Azure OpenAI evidence")
    lines.append("")

    if generated.is_file():
        lines.append("- **Generated rollup:** [`real-llm-run-evidence.md`](real-llm-run-evidence.md)")
    else:
        lines.append("- **Generated rollup:** not present — run `python scripts/ci/generate_real_llm_run_evidence.py`")

    if dated:
        latest = dated[-1].name
        lines.append(f"- **Latest dated cohort note:** [`{latest}`]({latest})")
    else:
        lines.append("- **Latest dated cohort note:** none checked in")

    if template.is_file():
        lines.append("- **Session template:** [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)")
    else:
        lines.append("- **Session template:** missing")

    lines.append("")
    lines.append(
        "Live Azure OpenAI runs are **not** merge-blocking on ordinary pull requests. "
        "When real-mode evidence was skipped, sponsor handoff must not claim live LLM quality."
    )
    lines.append("")

    return lines


def build_dashboard(root: Path) -> str:
    faith_path = root / "docs" / "quality" / "faithfulness-report.md"
    ir_path = root / "docs" / "quality" / "retrieval-ir-report.md"
    drift_path = root / "docs" / "quality" / "golden-cohort-drift-latest.md"

    faith_text = _read_text(faith_path)
    ir_text = _read_text(ir_path)
    drift_text = _read_text(drift_path)
    manifest = _load_manifest_summary(root)

    faith = _parse_faithfulness(faith_text) if faith_text else {"present": False}
    ir = _parse_retrieval_ir(ir_text) if ir_text else {"present": False}

    generated_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines: list[str] = []
    lines.append("# Agent quality evidence dashboard")
    lines.append("")
    lines.append(f"**Generated UTC:** {generated_utc}")
    lines.append("")
    lines.append("> Buyer-safe summary of golden-cohort offline evals and real-mode posture. "
                 "Regenerate with `python scripts/ci/generate_agent_quality_dashboard.py`.")
    lines.append("")
    lines.append("## Buyer-safe summary")
    lines.append("")
    lines.append("| Signal | Status | Evidence mode |")
    lines.append("| --- | --- | --- |")

    if faith.get("present"):
        positive_ratio = faith.get("positiveSupportRatio")
        negative_ratio = faith.get("negativeSupportRatio")
        mean_ratio = faith.get("meanSupportRatio")
        floor = faith.get("floorMinSupportRatio")
        status = _faithfulness_status(faith)
        lines.append(
            f"| Faithfulness positive readiness | **{status}** "
            f"(positive={positive_ratio}, negative={negative_ratio}, combined={mean_ratio}, floor={floor}) | offline fixtures |"
        )
    else:
        lines.append("| Faithfulness positive readiness | **NOT_COLLECTED** | — |")

    if ir.get("present"):
        recall = ir.get("meanRecallAt5")
        lines.append(f"| Retrieval IR recall@5 | **PASS** (mean={recall}) | offline fixtures |")
    else:
        lines.append("| Retrieval IR recall@5 | **NOT_COLLECTED** | — |")

    roi_rows = faith.get("unsupportedRoiCostRows", 0) if faith.get("present") else 0
    roi_status = "PASS" if roi_rows == 0 else "WARN"
    lines.append(f"| Unsupported ROI/cost claims (fixture scan) | **{roi_status}** ({roi_rows} rows flagged) | offline fixtures |")

    if manifest.get("present"):
        lines.append(
            f"| Eval dataset manifest | **PRESENT** (schema v{manifest.get('schemaVersion')}, "
            f"{manifest.get('datasetCount')} datasets) | committed repo |"
        )
    else:
        lines.append("| Eval dataset manifest | **MISSING** | — |")

    lines.append("")
    lines.append("### PilotStrict posture (operator)")
    lines.append("")
    lines.append("- Sponsor handoff uses **`FirstPilotAiQualityProof.ps1`** and consolidated AI readiness gate outputs.")
    lines.append("- See [`AGENT_QUALITY_STRICT_MODE_PILOT.md`](../runbooks/AGENT_QUALITY_STRICT_MODE_PILOT.md) for host configuration.")
    lines.append("")
    lines.extend(_real_mode_section(root))
    lines.append("## Internal-only caveats")
    lines.append("")
    lines.append("- Offline fixture passes do **not** prove live model behavior on buyer corpora.")
    lines.append("- Citation misses and wrong-corpus detections are tracked separately from unsupported ROI/cost claims.")
    lines.append("- Do not attach raw prompts, secrets, or customer payloads to this dashboard.")

    if drift_text:
        lines.append("")
        lines.append("## Golden cohort drift (latest)")
        lines.append("")
        lines.append(f"Source: [`golden-cohort-drift-latest.md`](golden-cohort-drift-latest.md)")

    lines.append("")
    lines.append("## Source artifacts")
    lines.append("")
    lines.append("| Artifact | Path |")
    lines.append("| --- | --- |")
    lines.append("| Faithfulness report | `docs/quality/faithfulness-report.md` |")
    lines.append("| Retrieval IR report | `docs/quality/retrieval-ir-report.md` |")
    lines.append("| Eval manifest | `tests/eval-datasets/manifest.json` |")
    lines.append("| Eval tooling | `scripts/ci/eval_agent_faithfulness.py`, `scripts/ci/eval_retrieval_ir.py` |")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate agent quality evidence dashboard markdown.")
    parser.add_argument(
        "--out",
        type=Path,
        default=_repo_root() / "docs" / "quality" / "agent-quality-dashboard.md",
        help="Output markdown path",
    )
    args = parser.parse_args()
    root = _repo_root()
    content = build_dashboard(root)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(content, encoding="utf-8")
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
