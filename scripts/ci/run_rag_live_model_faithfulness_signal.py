#!/usr/bin/env python3
"""Live-model RAG faithfulness nightly signal (RAG-V1-005 Phase B / assessment §17 #10).

Evaluates committed real-mode eval-corpus exemplars with Phase B LLM faithfulness
floors (p50, absolute, adversarial ceiling) and writes buyer-safe rollups for the
deeper RAG quality program. Uses committed ``*.real.json`` scores — no live OpenAI
invoke in this script.

See docs/go-to-market/AI_READINESS_POSTURE.md#deeper-rag-quality-program (§ Phase B).
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


_REAL_MODE_ENV_KEYS: tuple[tuple[str, str], ...] = (
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT", "corpus-real-mode-smoke.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_COST_AGENT_RESULT", "corpus-real-mode-cost.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_COMPLIANCE_AGENT_RESULT", "corpus-real-mode-compliance.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_CRITIC_AGENT_RESULT", "corpus-real-mode-critic.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_THREE_TIER_AGENT_RESULT", "corpus-real-mode-three-tier.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_MICROSERVICES_AGENT_RESULT", "corpus-real-mode-microservices.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_DATABASE_BACKUP_AGENT_RESULT", "corpus-real-mode-database-backup.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_OVERPROVISIONED_VM_AGENT_RESULT", "corpus-real-mode-overprovisioned-vm.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_MULTI_REGION_AGENT_RESULT", "corpus-real-mode-multi-region.real.json"),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_AZURE_WEB_APP_AGENT_RESULT", "corpus-real-mode-azure-web-app.real.json"),
    (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_CLOUD_MIGRATION_LIFT_SHIFT_AGENT_RESULT",
        "corpus-real-mode-cloud-migration-lift-shift.real.json",
    ),
    (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_GREENFIELD_MICROSERVICES_AGENT_RESULT",
        "corpus-real-mode-greenfield-microservices.real.json",
    ),
    (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_HEALTHCARE_HIPAA_AGENT_RESULT",
        "corpus-real-mode-healthcare-hipaa.real.json",
    ),
    (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_FINOPS_EXISTING_AZURE_AGENT_RESULT",
        "corpus-real-mode-finops-existing-azure.real.json",
    ),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_EVENT_DRIVEN_AGENT_RESULT", "corpus-real-mode-event-driven.real.json"),
    (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_MULTI_REGION_ACTIVE_ACTIVE_AGENT_RESULT",
        "corpus-real-mode-multi-region-active-active.real.json",
    ),
    (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_DATA_PLATFORM_ANALYTICS_AGENT_RESULT",
        "corpus-real-mode-data-platform-analytics.real.json",
    ),
    ("ARCHLUCID_EVAL_CORPUS_REAL_MODE_AI_ML_INFERENCE_AGENT_RESULT", "corpus-real-mode-ai-ml-inference.real.json"),
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_eval_agent_corpus():
    path = Path(__file__).resolve().parent / "eval_agent_corpus.py"
    spec = importlib.util.spec_from_file_location("eval_agent_corpus_rag_signal", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["eval_agent_corpus_rag_signal"] = mod
    spec.loader.exec_module(mod)
    return mod


def _configure_real_mode_env(root: Path) -> int:
    results_dir = root / "tests/eval-corpus/agent-results"
    configured = 0

    for env_key, file_name in _REAL_MODE_ENV_KEYS:
        path = results_dir / file_name

        if path.is_file():
            os.environ[env_key] = str(path.resolve())
            configured += 1

    return configured


def _evaluate_rows(root: Path, mod: Any) -> list[dict[str, Any]]:
    corpus_root = (root / "tests/eval-corpus").resolve()
    manifest_path = corpus_root / "manifest.json"
    manifest = mod._load_json(manifest_path)
    scen_list = manifest.get("scenarios")

    if not isinstance(scen_list, list):
        raise ValueError("manifest.scenarios must be a list")

    rows: list[dict[str, Any]] = []

    for rel in scen_list:
        if not isinstance(rel, str) or not rel.strip():
            continue

        scen_path = corpus_root / rel.strip()
        rows.append(mod.evaluate_scenario(scen_path, corpus_root))

    return rows


def _disposition(*, failures: list[str], positive_scored: int) -> str:
    if positive_scored == 0:
        return "NOT_COLLECTED"

    if failures:
        return "FAIL"

    return "PASS"


def _write_markdown(path: Path, summary: dict[str, Any]) -> None:
    lines = [
        "> **Scope:** Committed real-mode LLM faithfulness signal for the RAG quality program; "
        "does not invoke live models in CI.",
        "",
        "# RAG live-model faithfulness signal",
        "",
        f"- **Disposition:** **{summary.get('disposition')}**",
        f"- **Positive real-mode scenarios scored:** {summary.get('positiveScoredCount', 0)}",
        f"- **LLM faithfulness p50:** {summary.get('p50', 'n/a')}",
        f"- **p50 floor:** {summary.get('p50Floor', 'n/a')}",
        f"- **Absolute floor:** {summary.get('absoluteFloor', 'n/a')}",
        f"- **Adversarial ceiling:** {summary.get('adversarialCeiling', 'n/a')}",
        "",
        str(summary.get("interpretation")),
        "",
    ]

    failures = summary.get("failures")

    if isinstance(failures, list) and failures:
        lines.extend(["## Failures", ""])

        for failure in failures:
            lines.append(f"- {failure}")

        lines.append("")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _build_summary(
    llm_summary: dict[str, Any],
    *,
    failures: list[str],
    configured_exemplars: int,
) -> dict[str, Any]:
    positive_scored = int(llm_summary.get("positiveScoredCount") or 0)

    return {
        "formatVersion": "1.0",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "program": "rag-live-model-faithfulness-signal",
        "disposition": _disposition(failures=failures, positive_scored=positive_scored),
        "configuredExemplarCount": configured_exemplars,
        "positiveScoredCount": positive_scored,
        "p50": llm_summary.get("p50"),
        "p50Floor": llm_summary.get("p50Floor"),
        "absoluteFloor": llm_summary.get("absoluteFloor"),
        "adversarialCeiling": llm_summary.get("adversarialCeiling"),
        "positiveScenarioCount": llm_summary.get("positiveScenarioCount"),
        "adversarialScenarioCount": llm_summary.get("adversarialScenarioCount"),
        "llmFaithfulnessSummary": llm_summary,
        "failures": failures,
        "interpretation": (
            "Phase B scores come from committed real-mode exemplars with "
            "semanticScore.llmFaithfulnessScore — not a live deployment-model run in this job."
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 when Phase B LLM faithfulness floors fail.",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=None,
        help="JSON summary path (default: docs/quality/rag-live-model-faithfulness-summary.json).",
    )
    parser.add_argument(
        "--markdown-out",
        type=Path,
        default=None,
        help="Markdown summary path (default: docs/quality/rag-live-model-faithfulness-summary.md).",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    json_out = args.json_out or (root / "docs/quality/rag-live-model-faithfulness-summary.json")
    markdown_out = args.markdown_out or (root / "docs/quality/rag-live-model-faithfulness-summary.md")

    configured = _configure_real_mode_env(root)
    mod = _load_eval_agent_corpus()
    rows = _evaluate_rows(root, mod)
    llm_summary = mod.summarize_llm_faithfulness(rows)

    failures = mod.enforce_llm_faithfulness_floors(
        rows,
        p50_floor=mod._resolve_llm_faithfulness_p50_floor(),
        absolute_floor=mod._resolve_llm_faithfulness_absolute_floor(),
        adversarial_ceiling=mod._resolve_llm_faithfulness_adversarial_ceiling(),
    )

    summary = _build_summary(llm_summary, failures=failures, configured_exemplars=configured)
    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    _write_markdown(markdown_out, summary)

    disposition = str(summary.get("disposition"))

    if disposition == "NOT_COLLECTED":
        print("::warning::No real-mode exemplars configured; live-model faithfulness signal not collected.")

        return 0

    print(f"RAG live-model faithfulness signal: disposition={disposition} p50={summary.get('p50')}")

    if args.enforce and failures:
        for failure in failures:
            print(f"::error::{failure}", file=sys.stderr)

        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
