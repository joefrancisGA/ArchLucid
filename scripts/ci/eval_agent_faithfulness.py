#!/usr/bin/env python3
"""Offline RAG faithfulness scoring for golden cohort fixtures (Improvement #9 / TB-021).

Mirrors ``RetrievalFaithfulnessEvaluator`` in ``ArchLucid.Retrieval``: a retrieved chunk is
"supported" when its ``sourceId`` or ``title`` appears as a case-insensitive substring in the
agent output text.

Reads ``tests/eval-datasets/faithfulness-golden/cases.json`` and writes
``docs/quality/faithfulness-report.md``. Exit 0 by default; use ``--enforce`` to fail when the
mean support ratio is below ``minSupportRatio``.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _contains_citation(output: str, token: str | None) -> bool:
    if token is None or not str(token).strip():
        return False

    return str(token).lower() in output.lower()


def _evaluate_case(
    hits: list[dict[str, object]],
    agent_output: str,
    *,
    expected_corpus_kind: str | None = None,
    required_evidence_tokens: list[str] | None = None,
    claim_issue_kind: str | None = None,
) -> tuple[int, int, float, list[str], list[str], list[str]]:
    if not hits:
        return 0, 0, 1.0, [], [], []

    supported = 0
    unsupported: list[str] = []
    wrong_corpus: list[str] = []

    for hit in hits:
        source_id = str(hit.get("sourceId") or "")
        title = str(hit.get("title") or "")
        corpus_kind = str(hit.get("corpusKind") or "")
        cited = _contains_citation(agent_output, source_id) or _contains_citation(agent_output, title)

        if cited:
            supported += 1
        elif source_id.strip():
            unsupported.append(source_id)

        if expected_corpus_kind and corpus_kind.strip().lower() != expected_corpus_kind.strip().lower():
            wrong_corpus.append(source_id or title or "unknown-hit")

    unsupported_claims: list[str] = []

    for token in required_evidence_tokens or []:
        if not _contains_citation(agent_output, token):
            unsupported_claims.append(claim_issue_kind or "unsupported-claim")

    ratio = supported / len(hits)
    return len(hits), supported, ratio, unsupported, wrong_corpus, unsupported_claims


def _summarize_by_category(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, list[dict[str, object]]] = {}

    for row in rows:
        category = str(row.get("category") or "uncategorized")
        grouped.setdefault(category, []).append(row)

    summaries: list[dict[str, object]] = []

    for category in sorted(grouped.keys()):
        bucket = grouped[category]
        ratios = [float(row["ratio"]) for row in bucket]
        summaries.append(
            {
                "category": category,
                "caseCount": len(bucket),
                "meanSupportRatio": sum(ratios) / len(ratios),
            }
        )

    return summaries


NEGATIVE_CONTROL_CATEGORIES: tuple[str, ...] = (
    "missing-citation",
    "wrong-corpus",
    "roi-cost-unsupported",
)


def _cohort_kind(category: str) -> str:
    normalized = category.strip().lower()

    if normalized in NEGATIVE_CONTROL_CATEGORIES:
        return "negative-control"

    return "positive-readiness"


def _mean_ratio(rows: list[dict[str, object]]) -> float:
    if not rows:
        return 0.0

    return sum(float(row["ratio"]) for row in rows) / len(rows)


def _write_report(
    path: Path,
    *,
    cases: list[dict[str, object]],
    mean_ratio: float,
    min_ratio: float,
    category_breakdown: list[dict[str, object]],
) -> None:
    positive_cases = [row for row in cases if row.get("cohortKind") == "positive-readiness"]
    negative_cases = [row for row in cases if row.get("cohortKind") == "negative-control"]
    positive_mean = _mean_ratio(positive_cases)
    negative_mean = _mean_ratio(negative_cases)
    lines = [
        "> **Scope:** Auto-generated offline faithfulness report from golden fixtures; does not claim live-model validation.",
        "",
        "# RAG faithfulness report",
        "",
        f"- **Cases evaluated:** {len(cases)}",
        f"- **Positive readiness cases:** {len(positive_cases)}",
        f"- **Positive readiness support ratio:** {positive_mean:.4f}",
        f"- **Negative-control cases:** {len(negative_cases)}",
        f"- **Negative-control support ratio:** {negative_mean:.4f}",
        f"- **Combined diagnostic support ratio:** {mean_ratio:.4f}",
        f"- **Floor (minSupportRatio):** {min_ratio:.4f}",
        "",
        "## Interpretation",
        "",
        "- **Positive readiness support ratio** is the buyer-safe quality-posture number for normal supported-output fixtures.",
        "- **Negative-control support ratio** is diagnostic detector coverage for deliberately missing citations, wrong corpus, or unsupported ROI/cost claims.",
        "- **Combined diagnostic support ratio** preserves the historical all-case view for release engineering, but should not be quoted as the readiness-only score.",
        "",
        "## Per-category breakdown",
        "",
        "| Category | Cases | Mean support ratio |",
        "| --- | ---: | ---: |",
    ]

    for bucket in category_breakdown:
        lines.append(
            f"| {bucket['category']} | {bucket['caseCount']} | {float(bucket['meanSupportRatio']):.4f} |"
        )

    lines.extend(
        [
            "",
            "## Per-case results",
            "",
            "| Case | Cohort | Category | Retrieved | Supported | Ratio | Missing citations | Wrong corpus | Unsupported ROI/cost |",
            "|------|--------|----------|-----------|-----------|-------|-------------------|--------------|----------------------|",
        ]
    )

    for row in cases:
        lines.append(
            f"| {row['id']} | {row.get('cohortKind', '')} | {row.get('category', '')} | {row['retrieved']} | {row['supported']} | {row['ratio']:.4f} | "
            f"{', '.join(row['missingCitationIds']) or '-'} | "
            f"{', '.join(row['wrongCorpusIds']) or '-'} | "
            f"{', '.join(row['unsupportedRoiCostClaims']) or '-'} |"
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _resolve_min_support_ratio(payload: dict[str, object]) -> float:
    env_override = os.environ.get("ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO", "").strip()
    if env_override:
        return float(env_override)
    return float(payload.get("minSupportRatio", 0.8))


def _resolve_min_positive_support_ratio(payload: dict[str, object], min_ratio: float) -> float:
    env_override = os.environ.get("ARCHLUCID_FAITHFULNESS_MIN_POSITIVE_SUPPORT_RATIO", "").strip()
    if env_override:
        return float(env_override)

    configured = payload.get("minPositiveSupportRatio")
    if configured is not None:
        return float(configured)

    return min_ratio


def _resolve_max_negative_support_ratio(payload: dict[str, object]) -> float:
    env_override = os.environ.get("ARCHLUCID_FAITHFULNESS_MAX_NEGATIVE_SUPPORT_RATIO", "").strip()
    if env_override:
        return float(env_override)

    return float(payload.get("maxNegativeSupportRatio", 0.35))


def _detector_failures(cases: list[dict[str, object]]) -> list[str]:
    failures: list[str] = []

    for row in cases:
        category = str(row.get("category") or "")
        case_id = str(row.get("id") or "unknown")
        ratio = float(row["ratio"])
        missing = row.get("missingCitationIds") or []
        wrong_corpus = row.get("wrongCorpusIds") or []
        unsupported = row.get("unsupportedRoiCostClaims") or []

        if category == "missing-citation" and ratio > 0.0:
            failures.append(f"missing-citation detector did not flag case {case_id} (ratio={ratio:.4f})")

        if category == "wrong-corpus" and not wrong_corpus:
            failures.append(f"wrong-corpus detector did not flag case {case_id}")

        if category == "roi-cost-unsupported" and not unsupported:
            failures.append(f"unsupported-roi-cost detector did not flag case {case_id}")

    return failures


def _enforce_faithfulness_floors(
    *,
    cases: list[dict[str, object]],
    mean_ratio: float,
    min_ratio: float,
    min_positive_ratio: float,
    max_negative_ratio: float,
) -> list[str]:
    failures: list[str] = []

    positive_cases = [row for row in cases if row.get("cohortKind") == "positive-readiness"]
    negative_cases = [row for row in cases if row.get("cohortKind") == "negative-control"]
    positive_mean = _mean_ratio(positive_cases)
    negative_mean = _mean_ratio(negative_cases)

    if positive_cases and positive_mean < min_positive_ratio:
        failures.append(
            f"positive readiness support ratio {positive_mean:.4f} is below floor {min_positive_ratio:.4f}"
        )

    if negative_cases and negative_mean > max_negative_ratio:
        failures.append(
            f"negative-control support ratio {negative_mean:.4f} exceeds ceiling {max_negative_ratio:.4f}"
        )

    if mean_ratio < min_ratio:
        failures.append(f"combined diagnostic support ratio {mean_ratio:.4f} is below floor {min_ratio:.4f}")

    failures.extend(_detector_failures(cases))
    return failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 when mean support ratio is below minSupportRatio (or ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO).",
    )
    parser.add_argument(
        "--cases",
        type=Path,
        default=None,
        help="Override path to cases.json (default: tests/eval-datasets/faithfulness-golden/cases.json).",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=None,
        help="Override report output path (default: docs/quality/faithfulness-report.md).",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    cases_path = args.cases or (root / "tests" / "eval-datasets" / "faithfulness-golden" / "cases.json")
    report_path = args.report or (root / "docs" / "quality" / "faithfulness-report.md")

    if not cases_path.is_file():
        print(f"::error::Missing {cases_path}")
        return 1

    payload = _load_json(cases_path)
    if not isinstance(payload, dict):
        print("::error::cases.json must be an object")
        return 1

    min_ratio = _resolve_min_support_ratio(payload)
    min_positive_ratio = _resolve_min_positive_support_ratio(payload, min_ratio)
    max_negative_ratio = _resolve_max_negative_support_ratio(payload)
    raw_cases = payload.get("cases")
    if not isinstance(raw_cases, list) or not raw_cases:
        print("::error::cases must be a non-empty array")
        return 1

    evaluated: list[dict[str, object]] = []
    ratios: list[float] = []

    for entry in raw_cases:
        if not isinstance(entry, dict):
            print("::error::each case must be an object")
            return 1

        case_id = str(entry.get("id") or "unknown")
        category = str(entry.get("category") or "uncategorized")
        hits = entry.get("retrievalHits")
        output = str(entry.get("agentOutputText") or "")
        expected_corpus_kind = entry.get("expectedCorpusKind")
        raw_required_tokens = entry.get("requiredEvidenceTokens")
        claim_issue_kind = str(entry.get("claimIssueKind") or "unsupported-claim")

        if not isinstance(hits, list):
            print(f"::error::case {case_id}: retrievalHits must be an array")
            return 1

        required_tokens: list[str] = []
        if isinstance(raw_required_tokens, list):
            required_tokens = [str(token) for token in raw_required_tokens if str(token).strip()]

        retrieved, supported, ratio, unsupported, wrong_corpus, unsupported_claims = _evaluate_case(
            hits,
            output,
            expected_corpus_kind=str(expected_corpus_kind) if expected_corpus_kind is not None else None,
            required_evidence_tokens=required_tokens,
            claim_issue_kind=claim_issue_kind,
        )
        ratios.append(ratio)
        evaluated.append(
            {
                "id": case_id,
                "category": category,
                "cohortKind": _cohort_kind(category),
                "retrieved": retrieved,
                "supported": supported,
                "ratio": ratio,
                "missingCitationIds": unsupported,
                "wrongCorpusIds": wrong_corpus,
                "unsupportedRoiCostClaims": unsupported_claims,
            }
        )

        print(
            f"faithfulness case={case_id} retrieved={retrieved} supported={supported} ratio={ratio:.4f} "
            f"missing_citations={len(unsupported)} wrong_corpus={len(wrong_corpus)} "
            f"unsupported_roi_cost={len(unsupported_claims)}"
        )

    mean_ratio = sum(ratios) / len(ratios)
    category_breakdown = _summarize_by_category(evaluated)
    _write_report(
        report_path,
        cases=evaluated,
        mean_ratio=mean_ratio,
        min_ratio=min_ratio,
        category_breakdown=category_breakdown,
    )

    positive_cases = [row for row in evaluated if row.get("cohortKind") == "positive-readiness"]
    negative_cases = [row for row in evaluated if row.get("cohortKind") == "negative-control"]
    positive_mean = _mean_ratio(positive_cases)
    negative_mean = _mean_ratio(negative_cases)

    print(f"Wrote {report_path}")
    print(f"Positive readiness support ratio: {positive_mean:.4f} (floor {min_positive_ratio:.4f})")
    print(f"Negative-control support ratio: {negative_mean:.4f} (ceiling {max_negative_ratio:.4f})")
    print(f"Combined diagnostic support ratio: {mean_ratio:.4f} (floor {min_ratio:.4f})")

    if args.enforce:
        failures = _enforce_faithfulness_floors(
            cases=evaluated,
            mean_ratio=mean_ratio,
            min_ratio=min_ratio,
            min_positive_ratio=min_positive_ratio,
            max_negative_ratio=max_negative_ratio,
        )

        if failures:
            for failure in failures:
                print(f"::error::{failure}", file=sys.stderr)

            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
