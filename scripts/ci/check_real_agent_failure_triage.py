#!/usr/bin/env python3
"""Validate real-agent failure triage catalog coverage (assessment improvement #23)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE = REPO_ROOT / "scripts/ci/fixtures/real_agent_failure_triage.json"
CATALOG_TEST = REPO_ROOT / "ArchLucid.Application.Tests/Runs/RealAgentFailureTriageTests.cs"


def real_agent_failure_triage_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not FIXTURE.is_file():
        return [f"{FIXTURE.relative_to(root)}: missing fixture"]

    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    required = payload.get("requiredScenarioIds")

    if not isinstance(required, list) or not required:
        return [f"{FIXTURE.relative_to(root)}: requiredScenarioIds must be a non-empty array"]

    runbook_rel = str(payload.get("runbookPath", "docs/runbooks/AGENT_EXECUTION_FAILURES.md"))
    runbook_path = root / runbook_rel

    if not runbook_path.is_file():
        violations.append(f"{runbook_rel}: missing runbook")
        return violations

    runbook_text = runbook_path.read_text(encoding="utf-8")

    for scenario_id in required:
        if scenario_id not in runbook_text:
            violations.append(f"{runbook_rel}: missing triage scenario id {scenario_id!r}")

    if not CATALOG_TEST.is_file():
        violations.append(f"{CATALOG_TEST.relative_to(root)}: missing catalog unit test")
    else:
        catalog_test_text = CATALOG_TEST.read_text(encoding="utf-8")

        if "Catalog_covers_all_assessment_required_scenarios_with_operator_steps" not in catalog_test_text:
            violations.append(
                f"{CATALOG_TEST.relative_to(root)}: missing Catalog_covers_all_assessment_required_scenarios_with_operator_steps"
            )

    return violations


def main() -> int:
    violations = real_agent_failure_triage_violations(REPO_ROOT)

    if violations:
        print("Real-agent failure triage guard FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Real-agent failure triage guard: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
