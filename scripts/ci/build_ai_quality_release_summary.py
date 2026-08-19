#!/usr/bin/env python3
"""Build a consolidated AI quality release-signoff summary from existing artifacts."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.ai-quality-release-summary.v1"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None

    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError:
        return None

    return value if isinstance(value, dict) else None


def read_text(path: Path) -> str | None:
    if not path.is_file():
        return None

    return path.read_text(encoding="utf-8", errors="replace")


def first_existing(root: Path, bundle_dir: Path, relative_paths: list[str]) -> tuple[Path | None, str]:
    for relative in relative_paths:
        candidate = bundle_dir / relative

        if candidate.is_file():
            return candidate, "release-bundle"

    for relative in relative_paths:
        candidate = root / relative

        if candidate.is_file():
            return candidate, "repo-quality"

    return None, "missing"


def parse_percent_like(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        try:
            return float(value.strip().rstrip("%"))
        except ValueError:
            return None

    return None


def parse_faithfulness_report(text: str | None) -> dict[str, Any]:
    if text is None:
        return {"status": "MISSING", "evidenceMode": "offline-fixture", "detail": "faithfulness-report.md not found"}

    def metric(label: str) -> float | None:
        match = re.search(rf"\*\*{re.escape(label)}:\*\*\s+([0-9.]+)", text)
        return float(match.group(1)) if match else None

    positive = metric("Positive readiness support ratio")
    negative = metric("Negative-control support ratio")
    combined = metric("Combined diagnostic support ratio")
    floor = metric("Floor (minSupportRatio)")
    cases_match = re.search(r"\*\*Cases evaluated:\*\*\s+(\d+)", text)
    cases = int(cases_match.group(1)) if cases_match else None
    status = "PASS" if positive is not None and floor is not None and positive >= floor else "WARN"

    return {
        "status": status,
        "evidenceMode": "offline-fixture",
        "casesEvaluated": cases,
        "positiveReadinessSupportRatio": positive,
        "negativeControlSupportRatio": negative,
        "combinedDiagnosticSupportRatio": combined,
        "floorMinSupportRatio": floor,
        "detail": "offline faithfulness fixture report; does not prove live model behavior",
    }


def parse_retrieval_ir(summary: dict[str, Any] | None, report_present: bool) -> dict[str, Any]:
    if summary is None:
        return {
            "status": "MISSING",
            "evidenceMode": "offline-fixture",
            "reportPresent": report_present,
            "detail": "retrieval-ir-summary.json not found",
        }

    recall = parse_percent_like(summary.get("meanRecallAt5"))
    mrr = parse_percent_like(summary.get("meanMrr"))
    recall_floor = parse_percent_like(summary.get("floorRecallAt5"))
    mrr_floor = parse_percent_like(summary.get("floorMrr"))
    passes_recall = recall is not None and recall_floor is not None and recall >= recall_floor
    passes_mrr = mrr is not None and mrr_floor is not None and mrr >= mrr_floor

    return {
        "status": "PASS" if passes_recall and passes_mrr else "WARN",
        "evidenceMode": "offline-fixture",
        "reportPresent": report_present,
        "casesEvaluated": summary.get("casesEvaluated"),
        "meanRecallAt5": recall,
        "floorRecallAt5": recall_floor,
        "meanMrr": mrr,
        "floorMrr": mrr_floor,
        "detail": "offline retrieval IR fixtures; distinct from live run citation faithfulness",
    }


def parse_retrieval_grounding(summary: dict[str, Any] | None) -> dict[str, Any]:
    if summary is None:
        return {
            "status": "MISSING",
            "evidenceMode": "committed-run",
            "detail": "retrieval-grounding.json not found",
        }

    coverage = None

    for key in ("meanCitationCoverage", "citationCoverageMean", "meanCitationCoverageRatio"):
        if key in summary:
            coverage = parse_percent_like(summary.get(key))
            break

    if coverage is None and isinstance(summary.get("summary"), dict):
        nested = summary["summary"]

        for key in ("meanCitationCoverage", "citationCoverageMean", "meanCitationCoverageRatio"):
            if key in nested:
                coverage = parse_percent_like(nested.get(key))
                break

    return {
        "status": "PASS" if coverage is not None and coverage > 0 else "PRESENT",
        "evidenceMode": "committed-run",
        "meanCitationCoverage": coverage,
        "detail": "committed-run retrieval grounding trace attached",
    }


def parse_go_no_go(summary: dict[str, Any] | None) -> dict[str, Any]:
    if summary is None:
        return {
            "status": "MISSING",
            "evidenceMode": "committed-run",
            "detail": "go-no-go-summary.json with aiQualityProof not found",
        }

    ai_quality = summary.get("aiQualityProof")

    if not isinstance(ai_quality, dict):
        return {
            "status": "MISSING",
            "evidenceMode": "committed-run",
            "detail": "go-no-go-summary.json does not include aiQualityProof",
        }

    disposition = str(ai_quality.get("disposition") or ai_quality.get("status") or "").upper()

    return {
        "status": disposition or "PRESENT",
        "evidenceMode": "committed-run",
        "detail": "committed-run aiQualityProof present",
        "aiQualityProof": ai_quality,
    }


def parse_real_mode(evidence: dict[str, Any] | None) -> dict[str, Any]:
    if evidence is None:
        return {
            "status": "MISSING",
            "evidenceMode": "live-real-mode",
            "detail": "real-llm-evidence-gate.json not found",
        }

    return {
        "status": str(evidence.get("overallOutcome", "UNKNOWN")).upper(),
        "evidenceMode": "live-real-mode",
        "executionMode": evidence.get("executionMode"),
        "generatedUtc": evidence.get("generatedUtc"),
        "detail": "live real-mode evidence gate artifact attached",
    }


def parse_material_finding_faithfulness(summary: dict[str, Any] | None) -> dict[str, Any]:
    if summary is None:
        return {
            "status": "MISSING",
            "evidenceMode": "offline-fixture",
            "detail": "material-finding-faithfulness-summary.json not found",
        }

    rollup = str(summary.get("rollup") or "MISSING").upper()
    citation = summary.get("citationCoverage") if isinstance(summary.get("citationCoverage"), dict) else {}

    return {
        "status": rollup,
        "evidenceMode": str(summary.get("evidenceMode") or "offline-fixture"),
        "scenariosRequiringEvidenceRefs": citation.get("scenariosRequiringEvidenceRefs"),
        "scenariosPassingCitationRules": citation.get("scenariosPassingCitationRules"),
        "detail": summary.get("claimBoundary") or "material finding corpus rollup attached",
    }


def rollup_status(signals: list[dict[str, Any]]) -> str:
    statuses = [str(signal.get("status", "MISSING")).upper() for signal in signals]

    if all(status == "MISSING" for status in statuses):
        return "NOT_COLLECTED"

    if any(status in {"FAIL", "HOLD"} for status in statuses):
        return "HOLD"

    if any(status in {"WARN", "STALE", "MISSING"} for status in statuses):
        return "PARTIAL"

    return "PASS"


def build_summary(root: Path, bundle_dir: Path) -> dict[str, Any]:
    ir_summary_path, ir_source = first_existing(
        root,
        bundle_dir,
        ["retrieval-ir-summary.json", "docs/quality/retrieval-ir-summary.json"],
    )
    ir_report_path, _ = first_existing(
        root,
        bundle_dir,
        ["retrieval-ir-report.md", "docs/quality/retrieval-ir-report.md"],
    )
    faithfulness_path, faithfulness_source = first_existing(
        root,
        bundle_dir,
        ["faithfulness-report.md", "docs/quality/faithfulness-report.md"],
    )
    grounding_path, _ = first_existing(root, bundle_dir, ["retrieval-grounding.json"])
    go_no_go_path, _ = first_existing(root, bundle_dir, ["go-no-go-summary.json"])
    real_mode_path, _ = first_existing(root, bundle_dir, ["real-llm-evidence-gate.json"])
    material_path, material_source = first_existing(
        root,
        bundle_dir,
        ["material-finding-faithfulness-summary.json", "docs/quality/material-finding-faithfulness-summary.json"],
    )

    retrieval_ir = parse_retrieval_ir(read_json(ir_summary_path) if ir_summary_path else None, ir_report_path is not None)
    retrieval_ir["source"] = str(ir_summary_path) if ir_summary_path else None
    retrieval_ir["sourceScope"] = ir_source
    faithfulness = parse_faithfulness_report(read_text(faithfulness_path) if faithfulness_path else None)
    faithfulness["source"] = str(faithfulness_path) if faithfulness_path else None
    faithfulness["sourceScope"] = faithfulness_source
    retrieval_grounding = parse_retrieval_grounding(read_json(grounding_path) if grounding_path else None)
    retrieval_grounding["source"] = str(grounding_path) if grounding_path else None
    go_no_go = parse_go_no_go(read_json(go_no_go_path) if go_no_go_path else None)
    go_no_go["source"] = str(go_no_go_path) if go_no_go_path else None
    real_mode = parse_real_mode(read_json(real_mode_path) if real_mode_path else None)
    real_mode["source"] = str(real_mode_path) if real_mode_path else None
    material_finding = parse_material_finding_faithfulness(
        read_json(material_path) if material_path else None
    )
    material_finding["source"] = str(material_path) if material_path else None
    material_finding["sourceScope"] = material_source
    signals = [retrieval_ir, faithfulness, retrieval_grounding, go_no_go, real_mode, material_finding]

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "rollup": rollup_status(signals),
        "signals": {
            "retrievalIr": retrieval_ir,
            "faithfulness": faithfulness,
            "retrievalGrounding": retrieval_grounding,
            "goNoGoAiQualityProof": go_no_go,
            "realModeAiEvidence": real_mode,
            "materialFindingFaithfulness": material_finding,
        },
        "claimBoundary": (
            "Offline fixture passes do not prove live model behavior. "
            "Committed-run grounding and real-mode evidence are labeled separately."
        ),
    }


def render_markdown(summary: dict[str, Any]) -> str:
    signals = summary["signals"]
    rows = [
        ("Retrieval IR", signals["retrievalIr"]),
        ("Faithfulness", signals["faithfulness"]),
        ("Retrieval grounding", signals["retrievalGrounding"]),
        ("Go/no-go AI quality proof", signals["goNoGoAiQualityProof"]),
        ("Real-mode AI evidence", signals["realModeAiEvidence"]),
        ("Material finding faithfulness", signals["materialFindingFaithfulness"]),
    ]
    lines = [
        "# AI quality release summary",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        "",
        f"Rollup: **{summary['rollup']}**",
        "",
        "| Signal | Status | Evidence mode | Source | Detail |",
        "| --- | --- | --- | --- | --- |",
    ]

    for name, signal in rows:
        source = signal.get("source") or "(missing)"
        detail = str(signal.get("detail", ""))[:180].replace("|", "/")
        lines.append(f"| {name} | **{signal.get('status')}** | {signal.get('evidenceMode')} | `{source}` | {detail} |")

    lines.extend(["", summary["claimBoundary"], ""])
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = args.repo_root.resolve()
    bundle_dir = args.bundle_dir.resolve()
    summary = build_summary(root, bundle_dir)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
