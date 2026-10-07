"""Unit tests for evergreen.prior_work_gate."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.prior_work import PriorWork  # noqa: E402
from evergreen.prior_work_gate import PriorWorkGate  # noqa: E402
from evergreen.pull_request_record import PullRequestRecord  # noqa: E402

_NOW = datetime(2026, 10, 10, 12, 0, tzinfo=timezone.utc)
_FP = "fp0000000001"
_FAM = "fam000000001"


def _pull(
    title: str = "Evergreen: fix",
    body: str = "",
    state: str = "open",
    merged_ago: timedelta | None = None,
    closed_ago: timedelta | None = None,
    number: int = 3,
) -> PullRequestRecord:
    return PullRequestRecord(
        number=number,
        title=title,
        body=body,
        state=state,
        merged_at=_NOW - merged_ago if merged_ago is not None else None,
        closed_at=_NOW - closed_ago if closed_ago is not None else _NOW - merged_ago if merged_ago is not None else None,
    )


def _reason(*pulls: PullRequestRecord, comments: list[str] | None = None) -> str | None:
    prior = PriorWork(pull_requests=list(pulls), comment_bodies=comments or [])
    return PriorWorkGate().blocking_reason(_FP, _FAM, prior, _NOW)


class TestPriorWorkGate(unittest.TestCase):
    def test_nothing_blocks_with_empty_prior_work(self) -> None:
        self.assertIsNone(_reason())

    def test_open_pr_with_fingerprint_blocks(self) -> None:
        self.assertIn("open PR (#3)", _reason(_pull(body=f"Evergreen-Fingerprint: {_FP}")))

    def test_open_pr_without_the_marker_does_not_block(self) -> None:
        self.assertIsNone(_reason(_pull(body="Evergreen-Fingerprint: someone-else")))

    def test_open_escalation_blocks_by_fingerprint_or_family(self) -> None:
        by_fp = _pull(title="NEEDS OWNER: x", body=f"Evergreen-Fingerprint: {_FP}")
        by_family = _pull(title="NEEDS OWNER: x", body=f"Evergreen-Family: {_FAM}", number=4)

        self.assertIn("open PR (#3)", _reason(by_fp))
        self.assertIn("owner escalation PR #4 is still open", _reason(by_family))

    def test_escalation_for_a_different_failure_does_not_block(self) -> None:
        self.assertIsNone(_reason(_pull(title="NEEDS OWNER: x", body="Evergreen-Family: other0000000")))

    def test_family_marker_only_counts_for_escalations(self) -> None:
        self.assertIsNone(_reason(_pull(title="Evergreen: fix", state="closed", body=f"Evergreen-Family: {_FAM}")))

    def test_recently_merged_escalation_blocks_for_seven_days(self) -> None:
        body = f"Evergreen-Family: {_FAM}"

        inside = _pull(title="NEEDS OWNER: x", body=body, state="closed", merged_ago=timedelta(days=6, hours=23))
        outside = _pull(title="NEEDS OWNER: x", body=body, state="closed", merged_ago=timedelta(days=7, minutes=1))

        self.assertIn("settled within the last 7 days", _reason(inside))
        self.assertIsNone(_reason(outside))

    def test_closed_unmerged_escalation_also_cools_down(self) -> None:
        pull = _pull(title="NEEDS OWNER: x", body=f"Evergreen-Family: {_FAM}", state="closed", closed_ago=timedelta(days=1))

        self.assertIn("settled within", _reason(pull))

    def test_just_merged_fix_blocks_briefly(self) -> None:
        body = f"Evergreen-Fingerprint: {_FP}"

        fresh = _pull(body=body, state="closed", merged_ago=timedelta(hours=2))
        stale = _pull(body=body, state="closed", merged_ago=timedelta(hours=4))

        self.assertIn("fix PR #3 merged recently", _reason(fresh))
        self.assertIsNone(_reason(stale))

    def test_closed_unmerged_fix_does_not_block(self) -> None:
        self.assertIsNone(_reason(_pull(body=f"Evergreen-Fingerprint: {_FP}", state="closed", closed_ago=timedelta(hours=1))))

    def test_first_matching_pull_request_wins(self) -> None:
        first = _pull(body=f"Evergreen-Fingerprint: {_FP}", number=1)
        second = _pull(body=f"Evergreen-Fingerprint: {_FP}", number=2)

        self.assertIn("#1", _reason(first, second))

    def test_comment_marker_blocks_push_mode_relaunch(self) -> None:
        self.assertIn("on this pull request", _reason(comments=["hi", f"Evergreen-Fingerprint: {_FP}"]))
        self.assertIsNone(_reason(comments=["Evergreen-Fingerprint: other"]))

    def test_issue_reason_matches_open_report_issues_only(self) -> None:
        gate = PriorWorkGate()

        self.assertIn("report issue", gate.issue_reason(_FP, PriorWork(open_issue_bodies=[f"Evergreen-Fingerprint: {_FP}"])))
        self.assertIsNone(gate.issue_reason(_FP, PriorWork(open_issue_bodies=["Evergreen-Fingerprint: other"])))
        self.assertIsNone(gate.issue_reason(_FP, PriorWork()))

    def test_custom_cooldowns(self) -> None:
        gate = PriorWorkGate(escalation_cooldown=timedelta(days=1), merge_cooldown=timedelta(hours=12))
        merged = _pull(body=f"Evergreen-Fingerprint: {_FP}", state="closed", merged_ago=timedelta(hours=6))

        self.assertIn("merged recently", gate.blocking_reason(_FP, _FAM, PriorWork(pull_requests=[merged]), _NOW))


if __name__ == "__main__":
    unittest.main()
