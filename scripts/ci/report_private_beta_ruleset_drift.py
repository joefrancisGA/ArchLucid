#!/usr/bin/env python3
"""Report drift between the committed and observed private-beta ruleset contract."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.private-beta-ruleset-drift.v1"
_REQUIRED_BRANCH = "refs/heads/RC35"


def _contexts(payload: dict[str, Any]) -> set[str]:
    contexts: set[str] = set()

    for rule in payload.get("rules", []):
        if not isinstance(rule, dict):
            continue

        parameters = rule.get("parameters")
        if not isinstance(parameters, dict):
            continue

        checks = parameters.get("required_status_checks", [])
        if not isinstance(checks, list):
            continue

        for check in checks:
            if isinstance(check, dict) and isinstance(check.get("context"), str):
                contexts.add(check["context"])

    return contexts


def _branches(payload: dict[str, Any]) -> set[str]:
    conditions = payload.get("conditions")
    if not isinstance(conditions, dict):
        return set()

    ref_name = conditions.get("ref_name")
    if not isinstance(ref_name, dict) or not isinstance(ref_name.get("include"), list):
        return set()

    return {str(branch) for branch in ref_name["include"]}


def compare_rulesets(repository: dict[str, Any], live: dict[str, Any]) -> dict[str, Any]:
    repository_contexts = _contexts(repository)
    live_contexts = _contexts(live)
    repository_branches = _branches(repository)
    live_branches = _branches(live)
    missing_contexts = sorted(repository_contexts - live_contexts)
    unexpected_contexts = sorted(live_contexts - repository_contexts)
    issues = [
        *(
            [f"live ruleset is missing required context: {context}" for context in missing_contexts]
        ),
        *(
            [f"live ruleset has unexpected context: {context}" for context in unexpected_contexts]
        ),
    ]

    if _REQUIRED_BRANCH in repository_branches and _REQUIRED_BRANCH not in live_branches:
        issues.append("live ruleset does not include the RC35 release-cut branch")

    return {
        "schema": _SCHEMA,
        "disposition": "PASS" if not issues else "HOLD",
        "issues": issues,
        "repository": {
            "branches": sorted(repository_branches),
            "contexts": sorted(repository_contexts),
        },
        "live": {
            "branches": sorted(live_branches),
            "contexts": sorted(live_contexts),
        },
    }


def _load(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a JSON object")

    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository-ruleset", type=Path, required=True)
    parser.add_argument("--live-ruleset", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument(
        "--warn-only",
        action="store_true",
        help="Report HOLD as a warning and return success for non-blocking diagnostics.",
    )
    args = parser.parse_args()

    try:
        report = compare_rulesets(_load(args.repository_ruleset), _load(args.live_ruleset))
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if report["disposition"] == "HOLD" and args.warn_only:
        print(f"::warning::private-beta ruleset drift: {report['disposition']} ({'; '.join(report['issues'])})")
        return 0

    print(f"private-beta ruleset drift: {report['disposition']}")
    return 0 if report["disposition"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
