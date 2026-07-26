#!/usr/bin/env python3
"""Unified offline RAG quality program runner (assessment §17 #10 / TB-021).

Sequentially runs output-side faithfulness scoring, retrieval IR scoring, the
committed floor ratchet, and an optional pilot-proof rollup. Reuses existing
harnesses; does not duplicate IR or faithfulness logic.

See docs/go-to-market/AI_READINESS_POSTURE.md#deeper-rag-quality-program.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class ProgramStep:
    label: str
    script: str
    argv: tuple[str, ...]


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _ci_dir() -> Path:
    return Path(__file__).resolve().parent


def _build_steps(*, enforce: bool, skip_rollup: bool, include_live_model: bool) -> tuple[ProgramStep, ...]:
    enforce_flag = ("--enforce",) if enforce else ()
    steps: list[ProgramStep] = [
        ProgramStep(
            "faithfulness",
            "eval_agent_faithfulness.py",
            enforce_flag,
        ),
        ProgramStep(
            "retrieval-ir",
            "eval_retrieval_ir.py",
            enforce_flag,
        ),
        ProgramStep(
            "floor-ratchet",
            "assert_faithfulness_ir_floor_ratchet.py",
            (),
        ),
    ]

    if include_live_model:
        live_argv: tuple[str, ...] = ("--enforce",) if enforce else ()
        steps.append(
            ProgramStep(
                "live-model-faithfulness",
                "run_rag_live_model_faithfulness_signal.py",
                live_argv,
            ),
        )

    if not skip_rollup:
        steps.append(
            ProgramStep(
                "rollup",
                "report_retrieval_quality_rollup.py",
                (
                    "--markdown-out",
                    "docs/quality/rag-quality-program-rollup.md",
                    "--json-out",
                    "docs/quality/rag-quality-program-rollup.json",
                ),
            ),
        )

    return tuple(steps)


def _run_step(root: Path, step: ProgramStep) -> tuple[int, str]:
    script_path = _ci_dir() / step.script

    if not script_path.is_file():
        return 2, f"missing script {step.script}"

    argv = [sys.executable, str(script_path), *step.argv]
    completed = subprocess.run(argv, cwd=root, check=False, capture_output=True, text=True)
    output = (completed.stdout or "") + (completed.stderr or "")

    return completed.returncode, output.strip()


def _load_json_if_present(path: Path) -> dict[str, object] | None:
    if not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        return None

    return payload


def _build_program_summary(root: Path, *, step_results: list[dict[str, object]], enforce: bool) -> dict[str, object]:
    faithfulness = _load_json_if_present(root / "docs" / "quality" / "faithfulness-summary.json")
    retrieval = _load_json_if_present(root / "docs" / "quality" / "retrieval-ir-summary.json")
    live_model = _load_json_if_present(root / "docs" / "quality" / "rag-live-model-faithfulness-summary.json")
    rollup = _load_json_if_present(root / "docs" / "quality" / "rag-quality-program-rollup.json")

    failed_steps = [row for row in step_results if int(row.get("exitCode") or 0) != 0]
    disposition = "PASS"

    if failed_steps:
        disposition = "FAIL"

    program_name = "deeper-rag-quality-full" if any(
        row.get("label") == "live-model-faithfulness" for row in step_results
    ) else "deeper-rag-quality-offline"

    return {
        "formatVersion": "1.0",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "program": program_name,
        "enforceMode": enforce,
        "disposition": disposition,
        "steps": step_results,
        "faithfulnessSummary": faithfulness,
        "retrievalIrSummary": retrieval,
        "liveModelFaithfulnessSummary": live_model,
        "rollupSummary": rollup,
        "interpretation": (
            "Offline golden fixtures plus optional committed real-mode LLM faithfulness signal — "
            "does not invoke live models unless a separate golden-cohort live job runs."
        ),
    }


def _write_program_artifacts(root: Path, summary: dict[str, object]) -> None:
    json_path = root / "docs" / "quality" / "rag-quality-program-summary.json"
    md_path = root / "docs" / "quality" / "rag-quality-program-summary.md"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    faithfulness = summary.get("faithfulnessSummary") or {}
    retrieval = summary.get("retrievalIrSummary") or {}
    lines = [
        "> **Scope:** Auto-generated offline RAG quality program summary; does not claim live-model validation.",
        "",
        "# Deeper RAG quality program summary",
        "",
        f"- **Disposition:** **{summary.get('disposition')}**",
        f"- **Enforce mode:** {summary.get('enforceMode')}",
        "",
        "## Key metrics",
        "",
        f"- Positive readiness support ratio: {faithfulness.get('positiveReadinessSupportRatio', 'n/a')}",
        f"- PolicyPack mean MRR: {_policy_pack_mrr(retrieval)}",
        f"- Mean recall@5: {retrieval.get('meanRecallAt5', 'n/a')}",
        "",
        str(summary.get("interpretation")),
        "",
    ]
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _policy_pack_mrr(retrieval: object) -> str:
    if not isinstance(retrieval, dict):
        return "n/a"

    breakdown = retrieval.get("corpusBreakdown")

    if not isinstance(breakdown, list):
        return "n/a"

    for row in breakdown:
        if isinstance(row, dict) and str(row.get("corpusKind") or "") == "PolicyPack":
            return str(row.get("meanMrr", "n/a"))

    return "n/a"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Pass --enforce to faithfulness and retrieval IR harnesses; exit 1 on any step failure.",
    )
    parser.add_argument(
        "--include-live-model",
        action="store_true",
        help="Run committed real-mode LLM faithfulness signal (Phase B) after offline steps.",
    )
    parser.add_argument(
        "--skip-rollup",
        action="store_true",
        help="Skip report_retrieval_quality_rollup.py (faster local runs).",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    step_results: list[dict[str, object]] = []
    worst_exit = 0

    for step in _build_steps(
        enforce=args.enforce,
        skip_rollup=args.skip_rollup,
        include_live_model=args.include_live_model,
    ):
        exit_code, output = _run_step(root, step)
        step_results.append(
            {
                "label": step.label,
                "script": step.script,
                "exitCode": exit_code,
                "outputTail": output[-2000:] if output else "",
            },
        )

        if exit_code != 0:
            worst_exit = exit_code if worst_exit == 0 else max(worst_exit, exit_code)

            if args.enforce:
                print(f"::error::RAG quality program step '{step.label}' failed (exit {exit_code}).", file=sys.stderr)

                if output:
                    print(output, file=sys.stderr)

                summary = _build_program_summary(root, step_results=step_results, enforce=args.enforce)
                _write_program_artifacts(root, summary)

                return exit_code if exit_code != 0 else 1

    summary = _build_program_summary(root, step_results=step_results, enforce=args.enforce)
    _write_program_artifacts(root, summary)

    if args.enforce and worst_exit != 0:
        return worst_exit

    print(f"RAG quality program complete: disposition={summary.get('disposition')}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
