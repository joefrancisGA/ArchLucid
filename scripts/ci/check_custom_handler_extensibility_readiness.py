#!/usr/bin/env python3
"""Validate custom-handler extensibility readiness (assessment improvement #27)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GUIDE = REPO_ROOT / "docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md"
PROOF_TEST = REPO_ROOT / "ArchLucid.AgentRuntime.Tests/CustomAgentHandlerRegistrationProofTests.cs"
SAMPLE_HANDLER = REPO_ROOT / "ArchLucid.AgentRuntime.Tests/Fixtures/SampleRiskReviewHandler.cs"

REQUIRED_GUIDE_HEADINGS = (
    "## 1. When to use in-repo vs out-of-process",
    "## 4. `IAgentHandler`",
    "## 5. DI registration",
    "## 6. Simulator vs real mode",
    "## 7. Tests and verification",
    "## 8. Non-goals",
    "## 10. Extensibility readiness checklist",
)

REQUIRED_NON_GOAL_PHRASES = (
    "plugin marketplace",
    "MCP",
    "public plugin SDK",
)


def custom_handler_extensibility_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not GUIDE.is_file():
        return [f"{GUIDE.relative_to(root)}: missing guide"]

    guide_text = GUIDE.read_text(encoding="utf-8")

    for heading in REQUIRED_GUIDE_HEADINGS:
        if heading not in guide_text:
            violations.append(f"{GUIDE.relative_to(root)}: missing heading {heading!r}")

    for phrase in REQUIRED_NON_GOAL_PHRASES:
        if phrase.lower() not in guide_text.lower():
            violations.append(f"{GUIDE.relative_to(root)}: missing non-goal phrase {phrase!r}")

    if not SAMPLE_HANDLER.is_file():
        violations.append(f"{SAMPLE_HANDLER.relative_to(root)}: missing sample handler fixture")

    if not PROOF_TEST.is_file():
        violations.append(f"{PROOF_TEST.relative_to(root)}: missing registration proof tests")
    else:
        proof_text = PROOF_TEST.read_text(encoding="utf-8")

        if "Allowed_tools_guard_blocks_unlisted_custom_handler" not in proof_text:
            violations.append(
                f"{PROOF_TEST.relative_to(root)}: missing allowed-tools guard proof test"
            )

        if "Custom_handler_executes_through_real_executor_dispatch_path" not in proof_text:
            violations.append(
                f"{PROOF_TEST.relative_to(root)}: missing custom handler dispatch proof test"
            )

    return violations


def main() -> int:
    violations = custom_handler_extensibility_violations(REPO_ROOT)

    if violations:
        print("Custom-handler extensibility readiness FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Custom-handler extensibility readiness: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
