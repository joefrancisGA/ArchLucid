#!/usr/bin/env python3
"""Offline policy-pack attribution signal for eval-corpus fixtures (TB-884)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.policy-pack-attribution-summary.v1"
_CURATED_RULES_METADATA_KEY = "pack.curatedRules.v1"
_CLAIM_BOUNDARY = (
    "Offline eval-corpus fixtures only. Measures intersection of RulesApplied / PolicyRuleId "
    "with assigned pack rule ids. Does not prove live pack evaluation changed gate outcomes."
)


def collect_pack_rule_ids(pack: dict[str, Any]) -> set[str]:
    rule_ids: set[str] = set()

    for key in pack.get("complianceRuleKeys") or []:
        token = str(key).strip()

        if token:
            rule_ids.add(token)

    for guid in pack.get("complianceRuleIds") or []:
        token = str(guid).strip()

        if token:
            rule_ids.add(token)

    metadata = pack.get("metadata") or {}
    curated_json = metadata.get(_CURATED_RULES_METADATA_KEY)

    if curated_json is not None and str(curated_json).strip():
        try:
            payload = json.loads(str(curated_json))
            rules = payload.get("rules") or []

            if isinstance(rules, list):
                for rule in rules:
                    if not isinstance(rule, dict):
                        continue

                    rule_id = rule.get("id")

                    if rule_id is None:
                        continue

                    token = str(rule_id).strip()

                    if token:
                        rule_ids.add(token)
        except json.JSONDecodeError:
            pass

    return rule_ids


def _pack_lookup(pack_rule_ids: set[str]) -> set[str]:
    return {token.casefold() for token in pack_rule_ids if token.strip()}


def is_attributable(finding: dict[str, Any], pack_rule_ids: set[str]) -> bool:
    lookup = _pack_lookup(pack_rule_ids)

    policy_rule_id = finding.get("policyRuleId")

    if policy_rule_id is not None and str(policy_rule_id).strip():
        if str(policy_rule_id).strip().casefold() in lookup:
            return True

    for token in finding.get("rulesApplied") or []:
        trimmed = str(token).strip()

        if trimmed and trimmed.casefold() in lookup:
            return True

    return False


def _calculate_scenario(scenario: dict[str, Any]) -> tuple[float, int, int, list[dict[str, Any]]]:
    pack_rule_ids = collect_pack_rule_ids(scenario.get("packContent") or {})
    findings = scenario.get("findings") or []

    total_finding_count = len(findings)

    if total_finding_count == 0:
        return 0.0, 0, 0, []

    attributable_finding_count = 0
    by_engine: dict[str, dict[str, int]] = {}

    for finding in findings:
        engine_type = str(finding.get("engineType") or "")
        is_attr = is_attributable(finding, pack_rule_ids)

        if is_attr:
            attributable_finding_count += 1

        bucket = by_engine.setdefault(
            engine_type,
            {"findingCount": 0, "attributableFindingCount": 0},
        )
        bucket["findingCount"] += 1

        if is_attr:
            bucket["attributableFindingCount"] += 1

    attribution_percentage = (attributable_finding_count / total_finding_count) * 100.0

    by_engine_rows: list[dict[str, Any]] = []

    for engine_type in sorted(by_engine.keys(), key=str.casefold):
        bucket = by_engine[engine_type]
        finding_count = bucket["findingCount"]
        engine_attributable = bucket["attributableFindingCount"]
        engine_percentage = 0.0

        if finding_count > 0:
            engine_percentage = (engine_attributable / finding_count) * 100.0

        by_engine_rows.append(
            {
                "engineType": engine_type,
                "findingCount": finding_count,
                "attributableFindingCount": engine_attributable,
                "attributionPercentage": engine_percentage,
            }
        )

    return attribution_percentage, total_finding_count, attributable_finding_count, by_engine_rows


def _matches_expected(actual: float, expected: float) -> bool:
    return abs(actual - expected) < 1e-9


def build_summary(corpus_dir: Path) -> dict[str, Any]:
    scenario_rows: list[dict[str, Any]] = []

    for path in sorted(corpus_dir.glob("*.json"), key=lambda p: p.name.casefold()):
        scenario = json.loads(path.read_text(encoding="utf-8"))
        expected = float(scenario.get("expectedAttributionPercentage") or 0.0)
        attribution_percentage, total, attributable, by_engine = _calculate_scenario(scenario)
        matches_expected = _matches_expected(attribution_percentage, expected)

        scenario_rows.append(
            {
                "scenarioId": str(scenario.get("id") or path.stem),
                "file": path.name,
                "totalFindingCount": total,
                "attributableFindingCount": attributable,
                "attributionPercentage": attribution_percentage,
                "expectedAttributionPercentage": expected,
                "matchesExpected": matches_expected,
                "byEngine": by_engine,
            }
        )

    has_zero_percent_scenario = any(
        float(row.get("expectedAttributionPercentage") or 0.0) == 0.0 for row in scenario_rows
    )
    has_positive_percent_scenario = any(
        float(row.get("expectedAttributionPercentage") or 0.0) > 0.0 for row in scenario_rows
    )
    all_scenarios_match_expected = all(bool(row.get("matchesExpected")) for row in scenario_rows)
    rollup = "PASS" if all_scenarios_match_expected else "HOLD"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "rollup": rollup,
        "scenarioCount": len(scenario_rows),
        "hasZeroPercentScenario": has_zero_percent_scenario,
        "hasPositivePercentScenario": has_positive_percent_scenario,
        "allScenariosMatchExpected": all_scenarios_match_expected,
        "claimBoundary": _CLAIM_BOUNDARY,
        "scenarios": scenario_rows,
    }


def write_markdown(summary: dict[str, Any], path: Path) -> None:
    lines = [
        "# Policy-pack attribution summary",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        f"Rollup: **{summary['rollup']}**",
        "",
        "| Scenario | Attribution % | Expected % | Match | Findings | Attributable |",
        "| --- | --- | --- | --- | --- | --- |",
    ]

    for row in summary["scenarios"]:
        lines.append(
            f"| {row['scenarioId']} | {row['attributionPercentage']:.1f} | "
            f"{row['expectedAttributionPercentage']:.1f} | "
            f"{'yes' if row['matchesExpected'] else 'no'} | {row['totalFindingCount']} | "
            f"{row['attributableFindingCount']} |"
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
        default=repo_root / "tests" / "eval-corpus" / "policy-pack-attribution",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=repo_root / "docs" / "quality" / "policy-pack-attribution-summary.json",
    )
    parser.add_argument(
        "--markdown-out",
        type=Path,
        default=repo_root / "docs" / "quality" / "policy-pack-attribution-summary.md",
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
            print("Committed policy-pack attribution summary does not match corpus evaluation.", file=sys.stderr)
            return 1

    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_markdown(summary, markdown_path)

    if args.enforce:
        if not summary["hasZeroPercentScenario"] or not summary["hasPositivePercentScenario"]:
            print("Enforce requires both 0% and >0% expected scenarios in corpus.", file=sys.stderr)
            return 1

        if not summary["allScenariosMatchExpected"] or summary["rollup"] != "PASS":
            print("Enforce failed: scenario attribution does not match expected percentages.", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())