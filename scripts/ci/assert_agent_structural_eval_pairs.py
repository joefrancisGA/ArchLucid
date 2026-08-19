#!/usr/bin/env python3
"""Verify canonical simulator↔real structural eval pairs exist per agent family (TB-2225)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, NamedTuple

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CORPUS_ROOT = REPO_ROOT / "tests" / "eval-corpus"
DEFAULT_PAIRS_PATH = DEFAULT_CORPUS_ROOT / "agent-structural-eval-pairs.json"
DEFAULT_BASELINE_DIR = REPO_ROOT / "tests" / "golden-cohort" / "baselines"

REQUIRED_AGENT_TYPES = ("Topology", "Cost", "Compliance", "Critic")


class CorpusPaths(NamedTuple):
    corpus_root: Path
    manifest_path: Path
    baseline_dir: Path


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _scenario_id_from_path(paths: CorpusPaths, relative_scenario: str) -> str:
    scenario_path = paths.corpus_root / relative_scenario
    document = _load_json(scenario_path)
    scenario_id = document.get("id")

    if not isinstance(scenario_id, str) or not scenario_id.strip():
        raise ValueError(f"{relative_scenario}: missing string id")

    return scenario_id.strip()


def _baseline_path(paths: CorpusPaths, scenario_id: str) -> Path:
    safe_id = scenario_id.replace("/", "-").replace("\\", "-")
    return paths.baseline_dir / f"{safe_id}.baseline.json"


def _quality_evidence(paths: CorpusPaths, relative_scenario: str) -> dict[str, Any]:
    scenario_path = paths.corpus_root / relative_scenario
    document = _load_json(scenario_path)
    quality = document.get("qualityEvidence")

    if not isinstance(quality, dict):
        raise ValueError(f"{relative_scenario}: qualityEvidence object required")

    return quality


def _agent_result_path(paths: CorpusPaths, relative_scenario: str, mode: str) -> Path:
    quality = _quality_evidence(paths, relative_scenario)
    actual_mode = quality.get("mode")

    if actual_mode != mode:
        raise ValueError(
            f"{relative_scenario}: qualityEvidence.mode must be {mode!r}, got {actual_mode!r}",
        )

    if mode == "simulator":
        rel_path = quality.get("agentResultPath")

        if not isinstance(rel_path, str) or not rel_path.strip():
            raise ValueError(f"{relative_scenario}: qualityEvidence.agentResultPath required for simulator")

        return (paths.corpus_root / rel_path.strip()).resolve()

    rel_path = quality.get("agentResultPath")

    if isinstance(rel_path, str) and rel_path.strip():
        return (paths.corpus_root / rel_path.strip()).resolve()

    env_name = quality.get("agentResultPathEnv")

    if not isinstance(env_name, str) or not env_name.strip():
        raise ValueError(
            f"{relative_scenario}: qualityEvidence.agentResultPath or agentResultPathEnv required for real",
        )

    suffix = relative_scenario.replace("scenario-", "").replace(".json", "")
    candidate = paths.corpus_root / "agent-results" / f"corpus-{suffix}.real.json"

    if candidate.is_file():
        return candidate.resolve()

    scenario_id = _scenario_id_from_path(paths, relative_scenario)
    candidate = paths.corpus_root / "agent-results" / f"{scenario_id}.real.json"

    if candidate.is_file():
        return candidate.resolve()

    raise FileNotFoundError(
        f"{relative_scenario}: no committed real exemplar at {candidate} (set {env_name} locally for exports)",
    )


def _verify_pair(
    paths: CorpusPaths,
    pair: dict[str, Any],
    manifest_scenarios: set[str],
) -> list[str]:
    failures: list[str] = []
    agent_type = pair.get("agentType")
    simulator_scenario = pair.get("simulatorScenario")
    real_scenario = pair.get("realScenario")

    if agent_type not in REQUIRED_AGENT_TYPES:
        failures.append(f"pair agentType must be one of {REQUIRED_AGENT_TYPES}, got {agent_type!r}")
        return failures

    if not isinstance(simulator_scenario, str) or not simulator_scenario.strip():
        failures.append(f"{agent_type}: simulatorScenario string required")
        return failures

    if not isinstance(real_scenario, str) or not real_scenario.strip():
        failures.append(f"{agent_type}: realScenario string required")
        return failures

    simulator_scenario = simulator_scenario.strip()
    real_scenario = real_scenario.strip()

    for label, relative in (("simulator", simulator_scenario), ("real", real_scenario)):
        path = paths.corpus_root / relative

        if not path.is_file():
            failures.append(f"{agent_type} {label}: missing scenario file {relative}")
            continue

        if relative not in manifest_scenarios:
            failures.append(f"{agent_type} {label}: {relative} not listed in manifest.json")

    try:
        sim_quality = _quality_evidence(paths, simulator_scenario)
        real_quality = _quality_evidence(paths, real_scenario)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        failures.append(f"{agent_type}: {exc}")
        return failures

    if sim_quality.get("agentType") != agent_type:
        failures.append(
            f"{agent_type}: simulator qualityEvidence.agentType is {sim_quality.get('agentType')!r}",
        )

    if real_quality.get("agentType") != agent_type:
        failures.append(
            f"{agent_type}: real qualityEvidence.agentType is {real_quality.get('agentType')!r}",
        )

    try:
        sim_result = _agent_result_path(paths, simulator_scenario, "simulator")
        real_result = _agent_result_path(paths, real_scenario, "real")
    except (OSError, ValueError, FileNotFoundError) as exc:
        failures.append(f"{agent_type}: {exc}")
        return failures

    if not sim_result.is_file():
        failures.append(f"{agent_type}: missing simulator AgentResult at {sim_result.relative_to(REPO_ROOT)}")

    if not real_result.is_file():
        failures.append(f"{agent_type}: missing real exemplar at {real_result.relative_to(REPO_ROOT)}")

    for label, relative in (("simulator", simulator_scenario), ("real", real_scenario)):
        try:
            scenario_id = _scenario_id_from_path(paths, relative)
            baseline = _baseline_path(paths, scenario_id)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            failures.append(f"{agent_type} {label}: {exc}")
            continue

        if not baseline.is_file():
            failures.append(
                f"{agent_type} {label}: missing baseline {baseline.relative_to(REPO_ROOT)} "
                f"(run eval_agent_corpus.py --write-baseline)",
            )

    return failures


def verify_pairs(paths: CorpusPaths, pairs_path: Path) -> list[str]:
    if not pairs_path.is_file():
        return [f"Missing pairs manifest {pairs_path}"]

    if not paths.manifest_path.is_file():
        return [f"Missing eval corpus manifest {paths.manifest_path}"]

    pairs_document = _load_json(pairs_path)
    pairs = pairs_document.get("pairs")

    if not isinstance(pairs, list) or not pairs:
        return [f"{pairs_path}: pairs[] required"]

    manifest_document = _load_json(paths.manifest_path)
    manifest_list = manifest_document.get("scenarios")

    if not isinstance(manifest_list, list):
        return ["manifest.json scenarios[] required"]

    manifest_scenarios = {str(item).strip() for item in manifest_list if isinstance(item, str) and item.strip()}

    failures: list[str] = []
    seen_agents: set[str] = set()

    for pair in pairs:
        if not isinstance(pair, dict):
            failures.append("pair entry must be an object")
            continue

        agent_type = pair.get("agentType")

        if isinstance(agent_type, str):
            if agent_type in seen_agents:
                failures.append(f"duplicate pair for agentType {agent_type!r}")
            else:
                seen_agents.add(agent_type)

        failures.extend(_verify_pair(paths, pair, manifest_scenarios))

    for agent_type in REQUIRED_AGENT_TYPES:
        if agent_type not in seen_agents:
            failures.append(f"missing pair for agentType {agent_type!r}")

    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pairs-path",
        type=Path,
        default=DEFAULT_PAIRS_PATH,
        help="Path to agent-structural-eval-pairs.json",
    )
    parser.add_argument(
        "--corpus-root",
        type=Path,
        default=DEFAULT_CORPUS_ROOT,
        help="Eval corpus root (default: tests/eval-corpus)",
    )
    parser.add_argument(
        "--baseline-dir",
        type=Path,
        default=DEFAULT_BASELINE_DIR,
        help="Baseline directory (default: tests/golden-cohort/baselines)",
    )
    args = parser.parse_args()

    corpus_root = args.corpus_root.resolve()
    paths = CorpusPaths(
        corpus_root=corpus_root,
        manifest_path=corpus_root / "manifest.json",
        baseline_dir=args.baseline_dir.resolve(),
    )
    pairs_path = args.pairs_path.resolve()

    failures = verify_pairs(paths, pairs_path)

    if failures:
        for message in failures:
            print(f"::error::{message}")
        return 1

    pairs_document = _load_json(pairs_path)
    pair_count = len(pairs_document.get("pairs") or [])
    print(f"Agent structural eval pairs: verified {pair_count} simulator<->real pair(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
