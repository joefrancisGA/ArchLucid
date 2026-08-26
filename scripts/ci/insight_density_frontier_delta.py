#!/usr/bin/env python3
"""Offline frontier-baseline delta signal for insight-density eval-corpus fixtures."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.insight-density-frontier-delta-summary.v1"
_DEFAULT_THRESHOLD = 0.60
_CLAIM_BOUNDARY = (
    "Offline eval-corpus fixtures only. Hand-authored baseline transcripts are a regression instrument — "
    "not evidence that ArchLucid beats any named frontier model."
)


def jaccard_similarity(left: str, right: str) -> float:
    left_tokens = _tokenize(left)
    right_tokens = _tokenize(right)

    if not left_tokens and not right_tokens:
        return 1.0

    if not left_tokens or not right_tokens:
        return 0.0

    intersection = left_tokens.intersection(right_tokens)
    union = left_tokens.union(right_tokens)

    if not union:
        return 0.0

    return len(intersection) / len(union)


def _tokenize(text: str) -> set[str]:
    separators = [" ", "\t", "\r", "\n", ".", ",", ";", ":", "(", ")", "[", "]", "{", "}", "`", "'", '"']
    tokens: set[str] = set()
    parts = text

    for separator in separators:
        parts = parts.replace(separator, " ")

    for part in parts.split():
        normalized = part.strip().lower()

        if len(normalized) < 3:
            continue

        tokens.add(normalized)

    return tokens


def _rule_ids_match(finding_rule_id: Any, baseline_rule_id: Any) -> bool:
    if finding_rule_id is None or baseline_rule_id is None:
        return False

    finding_token = str(finding_rule_id).strip()

    if not finding_token:
        return False

    baseline_token = str(baseline_rule_id).strip()

    if not baseline_token:
        return False

    return finding_token.casefold() == baseline_token.casefold()


def _categories_match(finding_category: str, baseline_category: str) -> bool:
    return finding_category.strip().casefold() == baseline_category.strip().casefold()


def is_covered_by_baseline(
    finding: dict[str, Any],
    baseline_finding: dict[str, Any],
    threshold: float,
) -> bool:
    if _rule_ids_match(finding.get("policyRuleId"), baseline_finding.get("ruleId")):
        return True

    category = str(finding.get("category") or "")
    baseline_category = str(baseline_finding.get("category") or "")

    if not _categories_match(category, baseline_category):
        return False

    title = str(finding.get("title") or "")
    baseline_title = str(baseline_finding.get("title") or "")

    return jaccard_similarity(title, baseline_title) >= threshold


def is_covered_by_baseline_list(
    finding: dict[str, Any],
    baseline_findings: list[dict[str, Any]],
    threshold: float,
) -> bool:
    for baseline_finding in baseline_findings:
        if is_covered_by_baseline(finding, baseline_finding, threshold):
            return True

    return False


def _is_decision_grade(finding: dict[str, Any]) -> bool:
    classification = finding.get("classification")

    if classification is None:
        return True

    return str(classification).casefold() == "decisiongradefinding"


def _calculate_scenario(
    scenario: dict[str, Any],
    threshold: float,
) -> tuple[float, int, int, int, list[dict[str, Any]]]:
    findings = [
        finding
        for finding in (scenario.get("archlucidFindings") or [])
        if _is_decision_grade(finding)
    ]
    baseline_findings = (scenario.get("frontierBaseline") or {}).get("findings") or []

    total_finding_count = len(findings)

    if total_finding_count == 0:
        return 0.0, 0, 0, 0, []

    covered_by_baseline_count = 0
    by_engine: dict[str, dict[str, int]] = {}

    for finding in findings:
        engine_type = str(finding.get("engineType") or "")
        is_covered = is_covered_by_baseline_list(finding, baseline_findings, threshold)

        if is_covered:
            covered_by_baseline_count += 1

        bucket = by_engine.setdefault(
            engine_type,
            {"findingCount": 0, "novelFindingCount": 0},
        )
        bucket["findingCount"] += 1

        if not is_covered:
            bucket["novelFindingCount"] += 1

    novel_finding_count = total_finding_count - covered_by_baseline_count
    novelty_percentage = (novel_finding_count / total_finding_count) * 100.0

    by_engine_rows: list[dict[str, Any]] = []

    for engine_type in sorted(by_engine.keys(), key=str.casefold):
        bucket = by_engine[engine_type]
        finding_count = bucket["findingCount"]
        engine_novel_count = bucket["novelFindingCount"]
        engine_novelty_percentage = 0.0

        if finding_count > 0:
            engine_novelty_percentage = (engine_novel_count / finding_count) * 100.0

        by_engine_rows.append(
            {
                "engineType": engine_type,
                "findingCount": finding_count,
                "novelFindingCount": engine_novel_count,
                "noveltyPercentage": engine_novelty_percentage,
            }
        )

    return (
        novelty_percentage,
        total_finding_count,
        covered_by_baseline_count,
        novel_finding_count,
        by_engine_rows,
    )


def _matches_expected(actual: float, expected: float) -> bool:
    return abs(actual - expected) <= 0.001


def build_summary(corpus_dir: Path, threshold: float = _DEFAULT_THRESHOLD) -> dict[str, Any]:
    scenario_rows: list[dict[str, Any]] = []

    for path in sorted(corpus_dir.glob("*.json"), key=lambda p: p.name.casefold()):
        scenario = json.loads(path.read_text(encoding="utf-8"))
        expected = float(scenario.get("expectedNoveltyPercentage") or 0.0)
        (
            novelty_percentage,
            total,
            covered,
            novel,
            by_engine,
        ) = _calculate_scenario(scenario, threshold)
        matches_expected = _matches_expected(novelty_percentage, expected)

        scenario_rows.append(
            {
                "scenarioId": str(scenario.get("id") or path.stem),
                "file": path.name,
                "totalFindingCount": total,
                "coveredByBaselineCount": covered,
                "novelFindingCount": novel,
                "noveltyPercentage": novelty_percentage,
                "expectedNoveltyPercentage": expected,
                "matchesExpected": matches_expected,
                "byEngine": by_engine,
            }
        )

    has_zero_percent_scenario = any(
        float(row.get("expectedNoveltyPercentage") or 0.0) == 0.0 for row in scenario_rows
    )
    has_positive_percent_scenario = any(
        float(row.get("expectedNoveltyPercentage") or 0.0) > 0.0 for row in scenario_rows
    )
    all_scenarios_match_expected = all(bool(row.get("matchesExpected")) for row in scenario_rows)
    rollup = "PASS" if all_scenarios_match_expected else "HOLD"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "rollup": rollup,
        "scenarioCount": len(scenario_rows),
        "matchSimilarityThreshold": threshold,
        "hasZeroPercentScenario": has_zero_percent_scenario,
        "hasPositivePercentScenario": has_positive_percent_scenario,
        "allScenariosMatchExpected": all_scenarios_match_expected,
        "claimBoundary": _CLAIM_BOUNDARY,
        "scenarios": scenario_rows,
    }


def write_markdown(summary: dict[str, Any], path: Path) -> None:
    lines = [
        "# Insight-density frontier-delta summary",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        f"Rollup: **{summary['rollup']}**",
        f"Match threshold: **{summary['matchSimilarityThreshold']}**",
        "",
        "| Scenario | Novelty % | Expected % | Match | Findings | Novel | Covered |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]

    for row in summary["scenarios"]:
        lines.append(
            f"| {row['scenarioId']} | {row['noveltyPercentage']:.1f} | "
            f"{row['expectedNoveltyPercentage']:.1f} | "
            f"{'yes' if row['matchesExpected'] else 'no'} | {row['totalFindingCount']} | "
            f"{row['novelFindingCount']} | {row['coveredByBaselineCount']} |"
        )

    lines.extend(["", summary["claimBoundary"], ""])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _without_generated_utc(summary: dict[str, Any]) -> dict[str, Any]:
    stripped = dict(summary)
    stripped.pop("generatedUtc", None)
    return stripped


def main(argv: list[str] | None = None) -> int:
    repo_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--corpus",
        type=Path,
        default=repo_root / "tests" / "eval-corpus" / "insight-density-frontier-delta",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=repo_root / "docs" / "quality" / "insight-density-frontier-delta.json",
    )
    parser.add_argument(
        "--markdown-out",
        type=Path,
        default=repo_root / "docs" / "quality" / "insight-density-frontier-delta.md",
    )
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)

    corpus_dir = args.corpus.expanduser().resolve()
    summary = build_summary(corpus_dir)
    json_path = args.json_out.expanduser().resolve()
    markdown_path = args.markdown_out.expanduser().resolve()

    if args.check:
        if not json_path.is_file():
            print(f"Committed summary missing: {json_path}", file=sys.stderr)
            return 1

        committed = json.loads(json_path.read_text(encoding="utf-8"))

        if _without_generated_utc(committed) != _without_generated_utc(summary):
            print("Committed frontier-delta summary does not match corpus evaluation.", file=sys.stderr)
            return 1

    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_markdown(summary, markdown_path)

    if args.enforce:
        if not summary["hasZeroPercentScenario"] or not summary["hasPositivePercentScenario"]:
            print("Enforce requires both 0% and >0% expected scenarios in corpus.", file=sys.stderr)
            return 1

        if not summary["allScenariosMatchExpected"] or summary["rollup"] != "PASS":
            print("Enforce failed: scenario novelty does not match expected percentages.", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
