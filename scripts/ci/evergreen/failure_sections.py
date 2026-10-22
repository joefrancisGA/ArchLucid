"""Render failed jobs as Markdown; shared by the agent prompt and the report issue."""

from __future__ import annotations

import re

from evergreen.failure_digest import FailedJob

_BACKTICK_RUN = re.compile(r"`+")
_MIN_FENCE = 3
_BLOCK_SEPARATOR_LENGTH = len("\n\n")


def fence(text: str, info: str = "text") -> str:
    """Wrap ``text`` in a code fence longer than any backtick run inside it.

    Log excerpts are untrusted. A fixed three-backtick fence would let a log line containing three backticks
    close the block and have the rest render as live Markdown (links, @mentions) in an issue or prompt.
    """
    longest: int = max((len(run) for run in _BACKTICK_RUN.findall(text)), default=0)
    marker: str = "`" * max(_MIN_FENCE, longest + 1)
    return f"{marker}{info}\n{text}\n{marker}"


def failed_job_block(job: FailedJob) -> str:
    steps: str = ", ".join(job.failed_steps) if job.failed_steps else "(no step recorded)"
    excerpt: str = "\n".join(job.error_lines) if job.error_lines else "(no error lines captured)"
    return f"### Job: {job.name}\n\nFailed steps: {steps}\nJob log: {job.url}\n\n{fence(excerpt)}"


def failed_jobs_section(jobs: list[FailedJob], char_budget: int | None = None) -> str:
    """Render every failed job, or as many whole blocks as fit in ``char_budget`` characters.

    Whole blocks only: cutting inside a block would leave a code fence open and swallow whatever follows.
    Jobs that do not fit are listed by name so the reader knows where to look.
    """
    if char_budget is None:
        return "\n\n".join(failed_job_block(job) for job in jobs)

    blocks: list[str] = []
    used: int = 0

    for job in jobs:
        block: str = failed_job_block(job)

        if used + len(block) > char_budget:
            break

        blocks.append(block)
        used += len(block) + _BLOCK_SEPARATOR_LENGTH

    omitted: list[FailedJob] = jobs[len(blocks):]

    if omitted:
        names: str = ", ".join(job.name for job in omitted)
        blocks.append(f"_{len(omitted)} more failed job(s) omitted to fit the size limit: {names}. See the run for details._")

    return "\n\n".join(blocks)
