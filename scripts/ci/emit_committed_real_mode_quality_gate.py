#!/usr/bin/env python3
"""Emit real-llm-evidence-gate.json for committed exemplar evaluation (no live AOAI invoke)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.real-llm-evidence-gate.v2"
_QUAD_EXEMPLARS: tuple[tuple[str, str, str], ...] = (
    ("corpus-real-mode-smoke.real.json", "Topology", "1"),
    ("corpus-real-mode-cost.real.json", "Cost", "2"),
    ("corpus-real-mode-compliance.real.json", "Compliance", "3"),
    ("corpus-real-mode-critic.real.json", "Critic", "4"),
)
_ABSOLUTE_FLOOR = 0.50


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def _faithfulness_score(payload: dict[str, Any]) -> float | None:
    semantic = payload.get("semanticScore")

    if not isinstance(semantic, dict):
        return None

    score = semantic.get("llmFaithfulnessScore")

    if isinstance(score, (int, float)):
        return float(score)

    return None


def build_gate(*, results_dir: Path) -> dict[str, Any]:
    agent_paths: list[dict[str, Any]] = []
    missing_quad: list[str] = []
    below_floor: list[str] = []
    exemplar_count = 0

    for filename, agent_path, agent_type in _QUAD_EXEMPLARS:
        path = results_dir / filename
        payload = _load_json(path)

        if payload is None:
            missing_quad.append(filename)
            continue

        score = _faithfulness_score(payload)

        if score is None:
            missing_quad.append(f"{filename} (missing llmFaithfulnessScore)")
            continue

        if score < _ABSOLUTE_FLOOR:
            below_floor.append(f"{filename} ({score:.3f})")

        agent_paths.append(
            {
                "agentType": int(agent_type),
                "agentPath": agent_path,
                "outcome": "PASS",
                "llmFaithfulnessScore": round(score, 6),
                "source": "committed-exemplar",
            }
        )

    for path in sorted(results_dir.glob("*.real.json")):
        payload = _load_json(path)

        if payload is not None:
            exemplar_count += 1

    overall_outcome = "PASS"

    if missing_quad or below_floor:
        overall_outcome = "HOLD"

    disposition = "PASS_COMMITTED_EXEMPLAR" if overall_outcome == "PASS" else "HOLD_COMMITTED_EXEMPLAR"

    checks: list[dict[str, str]] = [
        {
            "name": "Committed real-mode exemplars",
            "result": "PASS" if exemplar_count > 0 else "FAIL",
            "detail": f"{exemplar_count} *.real.json file(s) under {results_dir.as_posix()}",
        },
        {
            "name": "Quad-agent exemplar coverage",
            "result": "PASS" if not missing_quad else "FAIL",
            "detail": "present" if not missing_quad else "; ".join(missing_quad),
        },
        {
            "name": "LLM faithfulness absolute floor",
            "result": "PASS" if not below_floor else "FAIL",
            "detail": f"floor={_ABSOLUTE_FLOOR}" if not below_floor else "; ".join(below_floor),
        },
    ]

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "overallOutcome": overall_outcome,
        "executionMode": "committed-exemplar",
        "credentialsPresent": False,
        "agentPaths": agent_paths,
        "committedExemplarCount": exemplar_count,
        "checks": checks,
        "claimBoundary": (
            "Committed exemplar evaluation only — does not prove live Azure OpenAI behavior. "
            "Use Invoke-RealLlmEvidenceGate.ps1 for live validation."
        ),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--results-dir",
        type=Path,
        default=repo_root() / "tests" / "eval-corpus" / "agent-results",
    )
    parser.add_argument("--json-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = build_gate(results_dir=args.results_dir.resolve())
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.json_out}")

    if payload["overallOutcome"] != "PASS":
        print(
            f"::error::committed real-mode quality gate is {payload['overallOutcome']}",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
