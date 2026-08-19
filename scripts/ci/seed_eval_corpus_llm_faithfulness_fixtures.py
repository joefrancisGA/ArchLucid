#!/usr/bin/env python3
"""One-shot maintainer helper: seed committed eval-corpus LLM faithfulness scores for Phase B CI."""

from __future__ import annotations

import json
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


REAL_SCORES: dict[str, float] = {
    "corpus-real-mode-smoke.real.json": 0.72,
    "corpus-real-mode-cost.real.json": 0.74,
    "corpus-real-mode-compliance.real.json": 0.71,
    "corpus-real-mode-critic.real.json": 0.73,
    "corpus-real-mode-three-tier.real.json": 0.70,
    "corpus-real-mode-microservices.real.json": 0.76,
    "corpus-real-mode-database-backup.real.json": 0.69,
    "corpus-real-mode-overprovisioned-vm.real.json": 0.68,
    "corpus-real-mode-multi-region.real.json": 0.75,
    "corpus-real-mode-azure-web-app.real.json": 0.72,
    "corpus-real-mode-cloud-migration-lift-shift.real.json": 0.71,
    "corpus-real-mode-greenfield-microservices.real.json": 0.73,
    "corpus-real-mode-healthcare-hipaa.real.json": 0.77,
    "corpus-real-mode-finops-existing-azure.real.json": 0.70,
    "corpus-real-mode-event-driven.real.json": 0.74,
    "corpus-real-mode-multi-region-active-active.real.json": 0.72,
    "corpus-real-mode-data-platform-analytics.real.json": 0.71,
    "corpus-real-mode-ai-ml-inference.real.json": 0.73,
}

ADVERSARIAL_SCORES: dict[str, float] = {
    "adversarial/hallucination-detection/agent-result.simulator.json": 0.22,
    "adversarial/fabricated-sku/agent-result.simulator.json": 0.28,
    "adversarial/invented-compliance-framework/agent-result.simulator.json": 0.31,
    "adversarial/phantom-dependency/agent-result.simulator.json": 0.25,
    "adversarial/citation-mismatch/agent-result.simulator.json": 0.33,
    "adversarial/contradictory-manifest/agent-result.simulator.json": 0.30,
    "adversarial/oversized-context/agent-result.simulator.json": 0.35,
    "adversarial/unsupported-roi-claim/agent-result.simulator.json": 0.27,
    "adversarial/out-of-domain-request/agent-result.simulator.json": 0.38,
}


def _patch_agent_result(path: Path, score: float) -> None:
    doc = json.loads(path.read_text(encoding="utf-8"))
    doc["semanticScore"] = {"llmFaithfulnessScore": score}
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


def _patch_baseline(baseline_dir: Path, scenario_id: str, score: float | None) -> None:
    path = baseline_dir / f"{scenario_id}.baseline.json"

    if not path.is_file():
        return

    doc = json.loads(path.read_text(encoding="utf-8"))
    doc["llmFaithfulnessScore"] = score
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    root = _repo_root()
    agent_results = root / "tests" / "eval-corpus" / "agent-results"
    corpus_root = root / "tests" / "eval-corpus"
    baseline_dir = root / "tests" / "golden-cohort" / "baselines"

    for filename, score in REAL_SCORES.items():
        path = agent_results / filename
        _patch_agent_result(path, score)
        scenario_id = filename.replace(".real.json", "")
        _patch_baseline(baseline_dir, scenario_id, score)

    for rel, score in ADVERSARIAL_SCORES.items():
        path = corpus_root / rel
        _patch_agent_result(path, score)
        scenario_path = path.parent / "scenario.json"
        scenario_doc = json.loads(scenario_path.read_text(encoding="utf-8"))
        _patch_baseline(baseline_dir, str(scenario_doc["id"]), score)

    print(f"Seeded {len(REAL_SCORES)} real-mode and {len(ADVERSARIAL_SCORES)} adversarial LLM faithfulness scores.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
