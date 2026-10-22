#!/usr/bin/env python3
"""Faithfulness + retrieval IR ratchet versus committed baselines.

Compares generated quality artifacts against ``tests/eval-datasets/faithfulness-ir-floors.json``.
Used by ``run_real_mode_ai_quality_evidence_ci.sh`` after offline harness runs.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        print(f"::error::Missing JSON artifact: {path}", file=sys.stderr)
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        print(f"::error::Expected object JSON in {path}", file=sys.stderr)
        return None

    return payload


def _read_positive_readiness_ratio(faithfulness_summary: dict[str, Any]) -> float | None:
    value = faithfulness_summary.get("positiveReadinessSupportRatio")

    if value is None:
        return None

    return float(value)


def _policy_pack_bucket(retrieval_summary: dict[str, Any]) -> dict[str, Any] | None:
    breakdown = retrieval_summary.get("corpusBreakdown")

    if not isinstance(breakdown, list):
        return None

    for row in breakdown:
        if isinstance(row, dict) and str(row.get("corpusKind") or "") == "PolicyPack":
            return row

    return None


def _main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--floors-file",
        type=Path,
        default=Path("tests/eval-datasets/faithfulness-ir-floors.json"),
        help="Committed baseline floors (default: tests/eval-datasets/faithfulness-ir-floors.json).",
    )
    parser.add_argument(
        "--faithfulness-summary",
        type=Path,
        default=Path("docs/quality/faithfulness-summary.json"),
        help="JSON summary from eval_agent_faithfulness.py.",
    )
    parser.add_argument(
        "--retrieval-summary",
        type=Path,
        default=Path("docs/quality/retrieval-ir-summary.json"),
        help="JSON summary from eval_retrieval_ir.py.",
    )
    args = parser.parse_args(argv)

    floors_payload = _load_json(args.floors_file)
    faithfulness_payload = _load_json(args.faithfulness_summary)
    retrieval_payload = _load_json(args.retrieval_summary)

    if floors_payload is None or faithfulness_payload is None or retrieval_payload is None:
        return 2

    slack_raw = floors_payload.get("slack")
    slack: dict[str, float] = {}

    if isinstance(slack_raw, dict):
        slack = {str(key): float(value) for key, value in slack_raw.items() if isinstance(value, (int, float))}

    failures: list[str] = []

    positive_floor = float(floors_payload.get("positiveReadinessSupportRatio", 0.0))
    positive_slack = float(slack.get("positiveReadinessSupportRatio", 0.03))
    positive_actual = _read_positive_readiness_ratio(faithfulness_payload)

    if positive_actual is not None and positive_actual + 1e-9 < positive_floor - positive_slack:
        failures.append(
            "positive readiness support ratio %.4f is below ratchet floor %.4f (slack %.4f)"
            % (positive_actual, positive_floor, positive_slack),
        )

    policy_pack = _policy_pack_bucket(retrieval_payload)

    if policy_pack is not None:
        mrr_floor = float(floors_payload.get("policyPackMeanMrr", 0.0))
        mrr_slack = float(slack.get("policyPackMeanMrr", 0.05))
        mrr_actual = float(policy_pack.get("meanMrr") or 0.0)

        if mrr_actual + 1e-9 < mrr_floor - mrr_slack:
            failures.append(
                "PolicyPack mean MRR %.4f is below ratchet floor %.4f (slack %.4f)"
                % (mrr_actual, mrr_floor, mrr_slack),
            )

        ndcg_floor = float(floors_payload.get("policyPackOrderingSensitiveMeanNdcgAt10", 0.0))
        ndcg_slack = float(slack.get("policyPackOrderingSensitiveMeanNdcgAt10", 0.05))
        ndcg_actual_raw = policy_pack.get("meanOrderingSensitiveNdcgAt10")

        if ndcg_actual_raw is not None:
            ndcg_actual = float(ndcg_actual_raw)

            if ndcg_actual + 1e-9 < ndcg_floor - ndcg_slack:
                failures.append(
                    "PolicyPack ordering-sensitive NDCG@10 %.4f is below ratchet floor %.4f (slack %.4f)"
                    % (ndcg_actual, ndcg_floor, ndcg_slack),
                )

    if failures:
        for failure in failures:
            print(f"::error::{failure}", file=sys.stderr)

        return 1

    print(
        "Faithfulness IR ratchet OK: positive readiness=%.4f PolicyPack MRR=%.4f"
        % (
            positive_actual if positive_actual is not None else 0.0,
            float(policy_pack.get("meanMrr") or 0.0) if policy_pack is not None else 0.0,
        ),
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
