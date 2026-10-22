"""Decide whether earlier work already covers a failure, so a new agent would only duplicate it."""

from __future__ import annotations

from datetime import datetime, timedelta

from evergreen import markers
from evergreen.prior_work import PriorWork
from evergreen.pull_request_record import PullRequestRecord


class PriorWorkGate:
    """Return the reason a launch is redundant, or ``None`` when nothing covers the failure.

    Why the time windows exist: an owner escalation (``NEEDS OWNER:``) records a decision only a human can
    make. Without a cool-down the agent would re-escalate the same issue after every red run, and each
    escalation costs a launch plus review time. A just-merged fix needs a fresh run to prove itself, so the
    red run that triggered us may simply predate the merge.
    """

    def __init__(
        self,
        escalation_cooldown: timedelta = timedelta(days=7),
        merge_cooldown: timedelta = timedelta(hours=3),
    ) -> None:
        self._escalation_cooldown = escalation_cooldown
        self._merge_cooldown = merge_cooldown

    def blocking_reason(self, fingerprint: str, family: str, prior: PriorWork, now: datetime) -> str | None:
        for pull in prior.pull_requests:
            reason: str | None = self._pull_request_reason(pull, fingerprint, family, now)

            if reason is not None:
                return reason

        return self._push_mode_reason(fingerprint, prior)

    def issue_reason(self, fingerprint: str, prior: PriorWork) -> str | None:
        if any(markers.carries(body, markers.FINGERPRINT_MARKER, fingerprint) for body in prior.open_issue_bodies):
            return "an open Evergreen report issue already carries this fingerprint"

        return None

    def _pull_request_reason(
        self, pull: PullRequestRecord, fingerprint: str, family: str, now: datetime
    ) -> str | None:
        same_failure: bool = markers.carries(pull.body, markers.FINGERPRINT_MARKER, fingerprint)

        if pull.is_open and same_failure:
            return f"an open PR (#{pull.number}) already carries this fingerprint"

        if pull.is_escalation and (same_failure or markers.carries(pull.body, markers.FAMILY_MARKER, family)):
            return self._escalation_reason(pull, now)

        if same_failure and self._merged_recently(pull, now):
            return f"fix PR #{pull.number} merged recently; waiting for a fresh run to prove it"

        return None

    def _escalation_reason(self, pull: PullRequestRecord, now: datetime) -> str | None:
        if pull.is_open:
            return f"owner escalation PR #{pull.number} is still open"

        if pull.settled_at is not None and now - pull.settled_at < self._escalation_cooldown:
            return f"owner escalation PR #{pull.number} settled within the last {self._escalation_cooldown.days} days"

        return None

    def _merged_recently(self, pull: PullRequestRecord, now: datetime) -> bool:
        return pull.merged_at is not None and now - pull.merged_at < self._merge_cooldown

    @staticmethod
    def _push_mode_reason(fingerprint: str, prior: PriorWork) -> str | None:
        if any(markers.carries(body, markers.FINGERPRINT_MARKER, fingerprint) for body in prior.comment_bodies):
            return "an agent was already launched for this fingerprint on this pull request"

        return None
