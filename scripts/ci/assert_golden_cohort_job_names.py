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


def check_workflow_text(text: str) -> list[str]:
    errors: list[str] = []

    if "cohort-real-llm-preflight:" in text:
        errors.append(
            "golden-cohort-nightly.yml regressed to cohort-real-llm-preflight; "
            "use cohort-real-llm-gate for branch-protection check name parity."
        )

    if "cohort-real-llm-gate:" not in text:
        errors.append("golden-cohort-nightly.yml missing cohort-real-llm-gate job")

    expected = (
        "concurrency:\n"
        "  group: golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}\n"
        "  cancel-in-progress: true\n"
    )

    normalized = text.replace("\r\n", "\n")

    if expected not in normalized:
        errors.append(
            "golden-cohort-nightly.yml missing PR-aware concurrency "
            "(golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }} "
            "with cancel-in-progress: true)"
        )

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
