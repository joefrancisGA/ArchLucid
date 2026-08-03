#!/usr/bin/env python3
"""TB-325 / TB-951 — assert prompt-injection guard fixtures and typed failure reason code stay wired."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIO = REPO_ROOT / "tests" / "eval-corpus" / "adversarial" / "prompt-injection-override" / "scenario.json"
MANIFEST = REPO_ROOT / "tests" / "eval-corpus" / "manifest.json"
DATASETS_MANIFEST = REPO_ROOT / "tests" / "eval-datasets" / "manifest.json"
INDIRECT_DATASET = (
    REPO_ROOT / "tests" / "eval-datasets" / "prompt-injection" / "indirect-doc-injection.json"
)
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

INDIRECT_CORPUS_SCENARIOS = [
    "adversarial/indirect-readme-override/scenario.json",
    "adversarial/indirect-adr-override/scenario.json",
    "adversarial/indirect-archdoc-approve-all/scenario.json",
]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    failures: list[str] = []

    if not SCENARIO.is_file():
        failures.append(f"missing scenario: {SCENARIO}")
    else:
        scenario = _load_json(SCENARIO)
        if not isinstance(scenario, dict):
            failures.append("prompt-injection-override scenario.json must be an object")
        else:
            precheck = scenario.get("precheckGuard") or {}
            if precheck.get("expectedFailureReasonCode") != "PromptInjectionDetected":
                failures.append(
                    "prompt-injection-override scenario must expect PromptInjectionDetected"
                )

    manifest = _load_json(MANIFEST)
    if not isinstance(manifest, dict):
        failures.append("eval-corpus manifest.json must be an object")
        scenarios: list[object] = []
    else:
        scenarios = list(manifest.get("scenarios") or [])

    if "adversarial/prompt-injection-override/scenario.json" not in scenarios:
        failures.append(
            "manifest.json must register adversarial/prompt-injection-override/scenario.json"
        )

    for rel in INDIRECT_CORPUS_SCENARIOS:
        if rel not in scenarios:
            failures.append(f"manifest.json must register {rel} (TB-951)")

        scenario_path = REPO_ROOT / "tests" / "eval-corpus" / Path(rel)
        if not scenario_path.is_file():
            failures.append(f"missing TB-951 corpus scenario: {scenario_path}")
            continue

        body = _load_json(scenario_path)
        if not isinstance(body, dict):
            failures.append(f"{rel} must be a JSON object")
            continue

        outcome = body.get("expectedOutcome") or {}
        if not isinstance(outcome, dict):
            failures.append(f"{rel} expectedOutcome must be an object")
            continue

        blocked_at = outcome.get("blockedAt")
        contained = outcome.get("expectedContained") is True

        if contained:
            if blocked_at not in (None, "null"):
                failures.append(
                    f"{rel}: expectedContained=true must use blockedAt null (honest residual)"
                )
            if outcome.get("mustNotGrantPrivilegedSideEffects") is not True:
                failures.append(
                    f"{rel}: contained scenarios must set mustNotGrantPrivilegedSideEffects=true"
                )
        elif blocked_at != "precheck":
            failures.append(
                f"{rel}: non-contained indirect scenarios must set blockedAt=precheck"
            )

    if not INDIRECT_DATASET.is_file():
        failures.append(f"missing TB-951 dataset: {INDIRECT_DATASET}")
    else:
        cases = _load_json(INDIRECT_DATASET)
        if not isinstance(cases, list) or len(cases) < 3:
            failures.append(
                "indirect-doc-injection.json must contain ≥3 cases (TB-951 acceptance)"
            )
        else:
            indirect_count = 0
            contained_count = 0
            for case in cases:
                if not isinstance(case, dict):
                    continue
                if case.get("category") != "indirect_injection":
                    continue
                indirect_count += 1
                if case.get("expectedContained") is True:
                    contained_count += 1
                    notes = case.get("containmentNotes")
                    if not isinstance(notes, str) or len(notes.strip()) < 24:
                        failures.append(
                            f"{case.get('id')}: expectedContained requires containmentNotes"
                        )

            if indirect_count < 3:
                failures.append(
                    f"indirect-doc-injection.json has {indirect_count} "
                    f"indirect_injection cases; need ≥3"
                )

            if contained_count < 1:
                failures.append(
                    "indirect-doc-injection.json must include ≥1 expectedContained=true "
                    "residual case (honest non-100% detection)"
                )

    if DATASETS_MANIFEST.is_file():
        ds_manifest = _load_json(DATASETS_MANIFEST)
        if isinstance(ds_manifest, dict):
            pir = ds_manifest.get("promptInjectionRegression") or {}
            paths = pir.get("relativePaths") if isinstance(pir, dict) else None
            if not isinstance(paths, list) or (
                "prompt-injection/indirect-doc-injection.json" not in paths
            ):
                failures.append(
                    "eval-datasets manifest must list "
                    "prompt-injection/indirect-doc-injection.json"
                )

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

    print(
        "prompt injection guard OK "
        "(scenario + indirect corpus + expectedContained residual + typed rejection)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
