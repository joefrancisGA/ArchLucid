#!/usr/bin/env python3
"""TB-325 — assert prompt-injection guard fixtures and typed failure reason code stay wired."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIO = REPO_ROOT / "tests" / "eval-corpus" / "adversarial" / "prompt-injection-override" / "scenario.json"
MANIFEST = REPO_ROOT / "tests" / "eval-corpus" / "manifest.json"
REASON_CODES = (
    REPO_ROOT
    / "ArchLucid.Contracts"
    / "Agents"
    / "AgentExecutionTraceFailureReasonCodes.cs"
)
CREATE_ORCH = (
    REPO_ROOT
    / "ArchLucid.Application"
    / "Runs"
    / "Orchestration"
    / "ArchitectureRunCreateOrchestrator.cs"
)


def main() -> int:
    failures: list[str] = []

    if not SCENARIO.is_file():
        failures.append(f"missing scenario: {SCENARIO}")
    else:
        scenario = json.loads(SCENARIO.read_text(encoding="utf-8"))
        precheck = scenario.get("precheckGuard") or {}
        if precheck.get("expectedFailureReasonCode") != "PromptInjectionDetected":
            failures.append("prompt-injection-override scenario must expect PromptInjectionDetected")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    scenarios = manifest.get("scenarios") or []
    if "adversarial/prompt-injection-override/scenario.json" not in scenarios:
        failures.append("manifest.json must register adversarial/prompt-injection-override/scenario.json")

    reason_text = REASON_CODES.read_text(encoding="utf-8")
    if "PromptInjectionDetected" not in reason_text:
        failures.append("AgentExecutionTraceFailureReasonCodes must define PromptInjectionDetected")

    create_text = CREATE_ORCH.read_text(encoding="utf-8")
    if "RequestContentSafetyRejectedException" not in create_text:
        failures.append("create orchestrator must throw RequestContentSafetyRejectedException")

    if failures:
        for line in failures:
            print(f"::error::{line}", file=sys.stderr)
        return 1

    print("prompt injection guard OK (scenario + manifest + typed rejection)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
