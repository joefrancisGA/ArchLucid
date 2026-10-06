"""Render the Cloud Agent prompt from a digest and a launch decision."""

from __future__ import annotations

from pathlib import Path

from evergreen.failure_digest import FailedJob, FailureDigest
from evergreen.launch_policy import LaunchDecision
from evergreen.launch_target import DeliveryMode

_DEFAULT_TEMPLATE = Path(__file__).with_name("prompt_template.md")

_DELIVERY_INSTRUCTIONS: dict[DeliveryMode, str] = {
    DeliveryMode.PULL_REQUEST: (
        "Work on a new `cursor/evergreen-*` branch from `{starting_ref}`. Open a pull request to "
        "`{starting_ref}`, apply the `evergreen` label, then run the `fix-ci` loop until every check "
        "on the PR is green. Do not merge; the owner merges Evergreen PRs."
    ),
    DeliveryMode.PUSH_TO_BRANCH: (
        "Commit directly on `{starting_ref}` (it already has an open pull request) and push. Then "
        "watch that pull request's checks and keep fixing until they are green."
    ),
}


class PromptRenderer:
    """Fill the Markdown template; the template owns the wording, this class owns the data."""

    def __init__(self, template_path: Path | None = None) -> None:
        self._template: str = (template_path or _DEFAULT_TEMPLATE).read_text(encoding="utf-8")

    def render(self, digest: FailureDigest, decision: LaunchDecision) -> str:
        mode: DeliveryMode = DeliveryMode(decision.delivery_mode)
        return self._template.format(
            repository=digest.repository,
            workflow_name=digest.workflow_name,
            run_url=digest.run_url,
            event=digest.event,
            head_branch=digest.head_branch,
            head_sha=digest.head_sha,
            pull_request_line=self._pull_request_line(digest),
            fingerprint=decision.fingerprint,
            delivery_mode=mode.value,
            starting_ref=decision.starting_ref,
            failed_jobs_section=self._failed_jobs_section(digest.failed_jobs),
            delivery_instructions=_DELIVERY_INSTRUCTIONS[mode].format(starting_ref=decision.starting_ref),
        )

    @staticmethod
    def _pull_request_line(digest: FailureDigest) -> str:
        if not digest.pull_request_numbers:
            return ""

        numbers: str = ", ".join(f"#{n}" for n in digest.pull_request_numbers)
        return f" (pull request {numbers})"

    @classmethod
    def _failed_jobs_section(cls, jobs: list[FailedJob]) -> str:
        return "\n\n".join(cls._failed_job_block(job) for job in jobs)

    @staticmethod
    def _failed_job_block(job: FailedJob) -> str:
        steps: str = ", ".join(job.failed_steps) if job.failed_steps else "(no step recorded)"
        excerpt: str = "\n".join(job.error_lines) if job.error_lines else "(no error lines captured)"
        return f"### Job: {job.name}\n\nFailed steps: {steps}\nJob log: {job.url}\n\n```text\n{excerpt}\n```"
