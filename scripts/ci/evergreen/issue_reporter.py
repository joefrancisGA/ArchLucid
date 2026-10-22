"""Open a GitHub issue for a failure that needs an owner's judgement instead of an agent."""

from __future__ import annotations

from evergreen import markers
from evergreen.failure_digest import FailureDigest
from evergreen.failure_sections import failed_jobs_section
from evergreen.github_cli import GitHubCli
from evergreen.launch_policy import LaunchDecision

REPORT_LABEL = "evergreen-report"
# GitHub rejects issue bodies over 65,536 characters; leave headroom for the fixed text and markers.
FAILED_JOBS_CHAR_BUDGET = 50_000


class IssueReporter:
    """Render the digest as an issue and create it. The label is also what dedupe searches by."""

    def __init__(self, github: GitHubCli) -> None:
        self._github = github

    @staticmethod
    def title(digest: FailureDigest) -> str:
        return f"Evergreen report: {digest.workflow_name} failed on {digest.head_branch}"

    @staticmethod
    def body(digest: FailureDigest, decision: LaunchDecision) -> str:
        return "\n".join(
            [
                "Evergreen did not launch an agent for this failure: the workflow is report-only because a red run "
                "usually means a threshold, baseline or finding needs an owner's decision, and an unattended agent "
                "would tend to loosen it.",
                "",
                f"- Workflow: `{digest.workflow_name}`",
                f"- Run: {digest.run_url}",
                f"- Event: `{digest.event}` on `{digest.head_branch}` at `{digest.head_sha}`",
                "",
                failed_jobs_section(digest.failed_jobs, FAILED_JOBS_CHAR_BUDGET),
                "",
                "Close this issue once the cause is handled; a later failure with the same fingerprint opens a new one.",
                "",
                markers.render(decision.fingerprint, decision.family),
            ]
        )

    def publish(self, digest: FailureDigest, decision: LaunchDecision) -> str:
        created = self._github.api_post(
            self._github.repo_path("issues"),
            {"title": self.title(digest), "body": self.body(digest, decision), "labels": [REPORT_LABEL]},
        )
        return str(created["html_url"])
