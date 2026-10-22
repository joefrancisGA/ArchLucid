#!/usr/bin/env python3
"""Verify TB-945 multi-agent failure-mode chaos suite is present and covers TB-937..TB-940."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_SUITE_TEST = (
    REPO_ROOT
    / "ArchLucid.Application.Tests"
    / "Orchestration"
    / "MultiAgentFailureModeChaosSuiteTests.cs"
)
DEFAULT_POISON_TEST = (
    REPO_ROOT
    / "ArchLucid.AgentRuntime.Tests"
    / "Caching"
    / "LlmCompletionCacheAdmissionTests.cs"
)
DEFAULT_DOC = REPO_ROOT / "docs" / "library" / "MULTI_AGENT_FAILURE_MODE_CHAOS_SUITE.md"

REQUIRED_SUITE_MARKERS = (
    "TB937_incomplete_quad_agent_batch",
    "TB938_selective_resume",
    "TB939_mid_run_budget_deny",
)

REQUIRED_TRAITS = (
    "TB940_poison_cache_hit_busts_and_calls_provider_again",
)


def _read(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"missing required path: {path}")

    return path.read_text(encoding="utf-8")


def _assert_contains(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise ValueError(f"{label}: expected marker {needle!r}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--suite-test", type=Path, default=DEFAULT_SUITE_TEST)
    parser.add_argument("--poison-test", type=Path, default=DEFAULT_POISON_TEST)
    parser.add_argument("--doc", type=Path, default=DEFAULT_DOC)
    args = parser.parse_args(argv)

    suite_source = _read(args.suite_test)
    poison_source = _read(args.poison_test)
    doc_source = _read(args.doc)

    for marker in REQUIRED_SUITE_MARKERS:
        _assert_contains(suite_source, marker, args.suite_test.name)

    if not re.search(r"public sealed class MultiAgentFailureModeChaosSuiteTests", suite_source):
        raise ValueError(f"{args.suite_test.name}: expected MultiAgentFailureModeChaosSuiteTests class")

    for trait in REQUIRED_TRAITS:
        _assert_contains(poison_source, trait, args.poison_test.name)

    for tb_id in ("TB-937", "TB-938", "TB-939", "TB-940"):
        _assert_contains(doc_source, tb_id, args.doc.name)

    print("TB-945 multi-agent failure-mode chaos suite guard: OK")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, ValueError) as exc:
        print(f"TB-945 multi-agent failure-mode chaos suite guard: FAIL — {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
