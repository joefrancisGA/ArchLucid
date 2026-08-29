#!/usr/bin/env python3
"""Guardrail: golden-cohort nightly keeps honest job ids and PR vs nightly split."""

from __future__ import annotations

import re
import sys
from pathlib import Path


PR_SKIP_MARKER = "github.event_name != 'pull_request'"

# Heavy nightly/eval jobs must not consume the PR hot path.
PR_SKIP_JOBS: tuple[str, ...] = (
    "cohort-faithfulness-phase-b-warn",
    "cohort-rag-live-model-faithfulness",
    "cohort-simulator-drift",
    "cohort-real-mode-eval-corpus",
)

# Required merge path: contract feeds the gate; the gate is a live required check.
PR_KEEP_JOBS: tuple[str, ...] = (
    "cohort-contract",
    "cohort-real-llm-gate",
)

_JOB_HEADER = re.compile(r"^  ([a-z0-9-]+):\s*$")
_JOB_LEVEL_IF = re.compile(r"^    if:")
_CONCURRENCY_GROUP = re.compile(r"^  group:\s*(.+)$")
_CONCURRENCY_CANCEL = re.compile(r"^  cancel-in-progress:\s*true\s*$")

# Workflow-level group must be PR-aware (PR number) with a ref fallback.
EXPECTED_CONCURRENCY_GROUP = (
    "golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}"
)


def _job_blocks(text: str) -> dict[str, str]:
    """Split the ``jobs:`` section into job-id -> job body (through the next job)."""
    blocks: dict[str, str] = {}
    current: str | None = None
    lines: list[str] = []
    in_jobs = False

    for line in text.splitlines(keepends=True):
        if not in_jobs:
            if line.rstrip("\n") == "jobs:":
                in_jobs = True

            continue

        match = _JOB_HEADER.match(line)

        if match is not None:
            if current is not None:
                blocks[current] = "".join(lines)

            current = match.group(1)
            lines = [line]
            continue

        if current is not None:
            lines.append(line)

    if current is not None:
        blocks[current] = "".join(lines)

    return blocks


def _job_level_if_text(job_body: str) -> str:
    """Return the job-level ``if:`` expression (possibly multiline), else empty."""
    body_lines = job_body.splitlines()
    collected: list[str] = []
    capturing = False

    for line in body_lines[1:]:
        if not capturing:
            if _JOB_LEVEL_IF.match(line):
                capturing = True
                collected.append(line)
            continue

        if line.startswith("      ") or line.strip() == "":
            collected.append(line)
            continue

        break

    return "\n".join(collected)


def _workflow_level_concurrency_block(text: str) -> str:
    """Return the top-level ``concurrency:`` mapping, ignoring job-level keys."""
    collected: list[str] = []
    capturing = False

    for line in text.replace("\r\n", "\n").splitlines():
        if not capturing:
            if line == "concurrency:":
                capturing = True
                collected.append(line)

            continue

        if line.startswith("  ") or line.strip() == "":
            collected.append(line)
            continue

        break

    return "\n".join(collected)


def _concurrency_errors(text: str) -> list[str]:
    """Require the workflow-level concurrency block, not a substring of the workflow name."""
    block = _workflow_level_concurrency_block(text)
    errors: list[str] = []

    if not block:
        return [
            "golden-cohort-nightly.yml missing top-level concurrency: block "
            f"(group: {EXPECTED_CONCURRENCY_GROUP} with cancel-in-progress: true)"
        ]

    group_value: str | None = None
    cancel_ok = False

    for line in block.splitlines():
        group_match = _CONCURRENCY_GROUP.match(line)

        if group_match is not None:
            group_value = group_match.group(1).strip().strip("\"'")

        if _CONCURRENCY_CANCEL.match(line):
            cancel_ok = True

    if group_value != EXPECTED_CONCURRENCY_GROUP:
        errors.append(
            "golden-cohort-nightly.yml concurrency.group must be "
            f"{EXPECTED_CONCURRENCY_GROUP} (found {group_value!r})"
        )

    if not cancel_ok:
        errors.append(
            "golden-cohort-nightly.yml concurrency.cancel-in-progress must be true "
            "on the workflow-level concurrency block"
        )

    return errors


def check_workflow_text(text: str) -> list[str]:
    errors: list[str] = []

    if "cohort-real-llm-preflight:" in text:
        errors.append(
            "golden-cohort-nightly.yml regressed to cohort-real-llm-preflight; "
            "use cohort-real-llm-gate for branch-protection check name parity."
        )

    if "cohort-real-llm-gate:" not in text:
        errors.append("golden-cohort-nightly.yml missing cohort-real-llm-gate job")

    errors.extend(_concurrency_errors(text))

    blocks = _job_blocks(text)

    for job_id in PR_SKIP_JOBS:
        body = blocks.get(job_id)

        if body is None:
            errors.append(f"golden-cohort-nightly.yml missing job {job_id}")
            continue

        if PR_SKIP_MARKER not in _job_level_if_text(body):
            errors.append(
                f"{job_id} must skip pull_request ({PR_SKIP_MARKER} on the job-level if:)"
            )

    for job_id in PR_KEEP_JOBS:
        body = blocks.get(job_id)

        if body is None:
            errors.append(f"golden-cohort-nightly.yml missing job {job_id}")
            continue

        if PR_SKIP_MARKER in _job_level_if_text(body):
            errors.append(
                f"{job_id} must remain on pull_request (it is on the merge-required path)"
            )

    return errors


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    path = root / ".github" / "workflows" / "golden-cohort-nightly.yml"
    errors = check_workflow_text(path.read_text(encoding="utf-8"))

    for message in errors:
        print(f"::error::{message}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
