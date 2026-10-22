"""Leave a marker comment on the pull request an agent was launched onto (push-to-branch mode)."""

from __future__ import annotations

from evergreen import markers
from evergreen.github_cli import GitHubCli
from evergreen.launch_policy import LaunchDecision


class LaunchAnnouncer:
    """The comment is both an audit trail for reviewers and the dedupe record the policy reads on later runs.

    Push-mode launches have no PR of their own to carry the fingerprint, so without this comment a failure
    that persists would launch a fresh agent on the same PR every day.
    """

    def __init__(self, github: GitHubCli) -> None:
        self._github = github

    @staticmethod
    def body(decision: LaunchDecision, agent_url: str) -> str:
        return "\n".join(
            [
                f"Evergreen launched a Cloud Agent for a failing check on this branch: {agent_url}",
                "",
                markers.render(decision.fingerprint, decision.family),
            ]
        )

    def announce(self, pull_request_numbers: list[int], decision: LaunchDecision, agent_url: str) -> list[str]:
        urls: list[str] = []

        for number in pull_request_numbers:
            created = self._github.api_post(
                self._github.repo_path(f"issues/{number}/comments"),
                {"body": self.body(decision, agent_url)},
            )
            urls.append(str(created["html_url"]))

        return urls
