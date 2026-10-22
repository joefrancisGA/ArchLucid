"""Everything already on GitHub that may make a new Evergreen launch redundant."""

from __future__ import annotations

from dataclasses import dataclass, field

from evergreen.pull_request_record import PullRequestRecord


@dataclass(frozen=True)
class PriorWork:
    # Recently updated pull requests in any state.
    pull_requests: list[PullRequestRecord] = field(default_factory=list)
    # Bodies of open (non-PR) issues, used to dedupe report-only failures.
    open_issue_bodies: list[str] = field(default_factory=list)
    # Comments on the failing run's own pull request(s), used to dedupe push-to-branch launches.
    comment_bodies: list[str] = field(default_factory=list)
