"""Unit tests for evergreen.launch_policy and evergreen.launch_target."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob, FailureDigest  # noqa: E402
from evergreen.lane import Lane  # noqa: E402
from evergreen.launch_policy import LaunchDecision, LaunchPolicy  # noqa: E402
from evergreen.launch_target import DeliveryMode, LaunchTarget, LaunchTargetResolver  # noqa: E402
from evergreen.prior_work import PriorWork  # noqa: E402
from evergreen.pull_request_record import PullRequestRecord  # noqa: E402

_NOW = datetime(2026, 10, 6, 12, 0, tzinfo=timezone.utc)
_FP = "abc123def456"
_FAMILY = "fam000111222"
_KEY = f"evergreen-launch-2026-10-06-{_FP}"
_REPORT_WORKFLOW = "Stryker (scheduled)"


def _digest(
    branch: str = "master",
    conclusion: str = "failure",
    jobs: int = 1,
    workflow: str = "W",
    event: str = "push",
) -> FailureDigest:
    return FailureDigest(
        repository="o/r",
        workflow_name=workflow,
        run_id=1,
        run_url="u",
        event=event,
        conclusion=conclusion,
        head_branch=branch,
        head_sha="s",
        failed_jobs=[FailedJob(name=f"j{i}", failed_steps=[], error_lines=[], url="") for i in range(jobs)],
    )


def _pull(number: int, title: str, body: str, state: str = "open") -> PullRequestRecord:
    return PullRequestRecord(number=number, title=title, body=body, state=state, merged_at=None, closed_at=None)


class TestLaunchTargetResolver(unittest.TestCase):
    def test_trunk_resolves_to_pull_request_mode(self) -> None:
        target = LaunchTargetResolver().resolve("master")

        self.assertEqual(target, LaunchTarget("master", DeliveryMode.PULL_REQUEST, Lane.TRUNK_GATE))
        self.assertTrue(target.auto_create_pr)
        self.assertFalse(target.work_on_current_branch)

    def test_scheduled_event_on_trunk_is_the_scheduled_lane(self) -> None:
        target = LaunchTargetResolver().resolve("master", "schedule")

        self.assertEqual(target, LaunchTarget("master", DeliveryMode.PULL_REQUEST, Lane.SCHEDULED))

    def test_bugsmash_resolves_to_push_mode(self) -> None:
        target = LaunchTargetResolver().resolve("bugsmash")

        self.assertEqual(target, LaunchTarget("bugsmash", DeliveryMode.PUSH_TO_BRANCH, Lane.BUGSMASH))
        self.assertFalse(target.auto_create_pr)
        self.assertTrue(target.work_on_current_branch)

    def test_dependabot_branches_resolve_to_push_mode(self) -> None:
        target = LaunchTargetResolver().resolve("dependabot/npm_and_yarn/archlucid-ui/npm-1a2b")

        self.assertEqual(
            target,
            LaunchTarget("dependabot/npm_and_yarn/archlucid-ui/npm-1a2b", DeliveryMode.PUSH_TO_BRANCH, Lane.DEPENDABOT),
        )

    def test_other_branches_are_out_of_scope(self) -> None:
        resolver = LaunchTargetResolver()

        self.assertIsNone(resolver.resolve("RC35"))
        self.assertIsNone(resolver.resolve("cursor/understand-use-wave-at-dc80"))
        self.assertIsNone(resolver.resolve("not-dependabot/x"))
        self.assertIsNone(resolver.resolve(""))


class TestLaunchPolicy(unittest.TestCase):
    def _decide(
        self,
        digest: FailureDigest,
        prior: PriorWork | None = None,
        keys: list[str] | None = None,
        cap: int = 6,
        trunk_failed: set[str] | None = None,
        disabled: frozenset[Lane] = frozenset(),
    ) -> LaunchDecision:
        provider = (lambda: trunk_failed) if trunk_failed is not None else None
        policy = LaunchPolicy(max_per_day=cap, disabled_lanes=disabled)
        return policy.decide(digest, _FP, _FAMILY, _NOW, prior or PriorWork(), keys or [], provider)

    def test_launches_trunk_failure_with_clean_state(self) -> None:
        decision = self._decide(_digest())

        self.assertTrue(decision.launch)
        self.assertFalse(decision.report)
        self.assertEqual(decision.reason, "launch")
        self.assertEqual(decision.fingerprint, _FP)
        self.assertEqual(decision.family, _FAMILY)
        self.assertEqual(decision.lane, "trunk_gate")
        self.assertEqual(decision.cache_key, _KEY)
        self.assertEqual(decision.starting_ref, "master")
        self.assertEqual(decision.delivery_mode, "pull_request")
        self.assertEqual(decision.launches_today, 0)
        self.assertEqual(decision.to_dict()["cache_key"], _KEY)

    def test_scheduled_failure_launches_in_the_scheduled_lane(self) -> None:
        decision = self._decide(_digest(workflow="Live E2E nightly", event="schedule"))

        self.assertTrue(decision.launch)
        self.assertEqual(decision.lane, "scheduled")
        self.assertEqual(decision.delivery_mode, "pull_request")

    def test_skips_non_failure_conclusions(self) -> None:
        decision = self._decide(_digest(conclusion="cancelled"))

        self.assertFalse(decision.launch)
        self.assertIn("'cancelled'", decision.reason)
        self.assertEqual(decision.starting_ref, "")
        self.assertEqual(decision.lane, "")

    def test_skips_when_no_failed_jobs(self) -> None:
        decision = self._decide(_digest(jobs=0))

        self.assertFalse(decision.launch)
        self.assertEqual(decision.reason, "no failed jobs in the run")

    def test_skips_out_of_scope_branch(self) -> None:
        decision = self._decide(_digest(branch="RC35"))

        self.assertFalse(decision.launch)
        self.assertIn("outside Evergreen scope", decision.reason)

    def test_skips_a_disabled_lane(self) -> None:
        decision = self._decide(_digest(branch="dependabot/x"), disabled=frozenset({Lane.DEPENDABOT}))

        self.assertFalse(decision.launch)
        self.assertIn("lane 'dependabot' is disabled", decision.reason)

    def test_other_lanes_still_launch_when_one_is_disabled(self) -> None:
        self.assertTrue(self._decide(_digest(), disabled=frozenset({Lane.DEPENDABOT})).launch)

    def test_skips_when_fingerprint_launched_today(self) -> None:
        # Build the second id via cache_key so a high-entropy literal is not adjacent to
        # ``_KEY,`` — gitleaks generic-api-key matches ``key, "<mixed-entropy>"``.
        other_today = LaunchPolicy.cache_key("other", _NOW.date())

        decision = self._decide(_digest(), keys=[_KEY, other_today])

        self.assertFalse(decision.launch)
        self.assertIn("already launched", decision.reason)
        self.assertEqual(decision.launches_today, 2)
        self.assertEqual(decision.delivery_mode, "pull_request")

    def test_skips_when_open_pr_carries_fingerprint(self) -> None:
        prior = PriorWork(
            pull_requests=[_pull(1, "unrelated", "nothing"), _pull(2, "Fix", f"Evergreen-Fingerprint: {_FP}\n")]
        )

        decision = self._decide(_digest(), prior=prior)

        self.assertFalse(decision.launch)
        self.assertIn("open PR (#2)", decision.reason)

    def test_prefix_match_on_fingerprint_does_not_count_as_open_pr(self) -> None:
        prior = PriorWork(pull_requests=[_pull(1, "Fix", f"Evergreen-Fingerprint: {_FP}zz")])

        # A longer fingerprint that merely starts with ours is a different root cause.
        self.assertTrue(self._decide(_digest(), prior=prior).launch)

    def test_skips_when_owner_escalation_matches_family(self) -> None:
        prior = PriorWork(pull_requests=[_pull(7, "NEEDS OWNER: gitleaks history", f"Evergreen-Family: {_FAMILY}")])

        decision = self._decide(_digest(), prior=prior)

        self.assertFalse(decision.launch)
        self.assertIn("owner escalation PR #7 is still open", decision.reason)

    def test_skips_when_daily_cap_reached(self) -> None:
        keys = [f"evergreen-launch-2026-10-06-{i}" for i in range(2)]

        decision = self._decide(_digest(), keys=keys, cap=2)

        self.assertFalse(decision.launch)
        self.assertEqual(decision.reason, "daily cap reached (2/2)")

    def test_bugsmash_launches_in_push_mode(self) -> None:
        decision = self._decide(_digest(branch="bugsmash"))

        self.assertTrue(decision.launch)
        self.assertEqual(decision.delivery_mode, "push_to_branch")
        self.assertEqual(decision.starting_ref, "bugsmash")
        self.assertEqual(decision.lane, "bugsmash")

    def test_bugsmash_does_not_consult_trunk_state(self) -> None:
        self.assertTrue(self._decide(_digest(branch="bugsmash"), trunk_failed={"j0"}).launch)

    def test_dependabot_launches_when_trunk_is_green(self) -> None:
        decision = self._decide(_digest(branch="dependabot/npm/x"), trunk_failed=set())

        self.assertTrue(decision.launch)
        self.assertEqual(decision.lane, "dependabot")
        self.assertEqual(decision.delivery_mode, "push_to_branch")

    def test_dependabot_skips_when_the_same_job_fails_on_trunk(self) -> None:
        decision = self._decide(_digest(branch="dependabot/npm/x"), trunk_failed={"j0", "other"})

        self.assertFalse(decision.launch)
        self.assertIn("already failing on trunk", decision.reason)

    def test_dependabot_launches_when_trunk_failure_is_a_different_job(self) -> None:
        self.assertTrue(self._decide(_digest(branch="dependabot/npm/x"), trunk_failed={"unrelated"}).launch)

    def test_dependabot_without_a_trunk_provider_launches(self) -> None:
        self.assertTrue(self._decide(_digest(branch="dependabot/npm/x")).launch)

    def test_dependabot_skips_when_a_comment_records_an_earlier_launch(self) -> None:
        prior = PriorWork(comment_bodies=[f"Evergreen launched ...\nEvergreen-Fingerprint: {_FP}"])

        decision = self._decide(_digest(branch="dependabot/npm/x"), prior=prior, trunk_failed=set())

        self.assertFalse(decision.launch)
        self.assertIn("on this pull request", decision.reason)

    def test_report_only_workflow_on_trunk_reports_instead_of_launching(self) -> None:
        decision = self._decide(_digest(workflow=_REPORT_WORKFLOW, event="schedule"))

        self.assertFalse(decision.launch)
        self.assertTrue(decision.report)
        self.assertIn("opening an issue", decision.reason)
        self.assertEqual(decision.lane, "scheduled")

    def test_report_only_workflow_skips_when_an_open_report_issue_exists(self) -> None:
        prior = PriorWork(open_issue_bodies=[f"Evergreen-Fingerprint: {_FP}"])

        decision = self._decide(_digest(workflow=_REPORT_WORKFLOW, event="schedule"), prior=prior)

        self.assertFalse(decision.report)
        self.assertIn("open Evergreen report issue", decision.reason)

    def test_report_only_workflow_is_not_reported_for_dependabot_branches(self) -> None:
        decision = self._decide(_digest(branch="dependabot/npm/x", workflow=_REPORT_WORKFLOW))

        self.assertFalse(decision.report)
        self.assertFalse(decision.launch)
        self.assertIn("trunk only", decision.reason)

    def test_report_decisions_ignore_the_daily_launch_cap(self) -> None:
        keys = [f"evergreen-launch-2026-10-06-{i}" for i in range(6)]

        decision = self._decide(_digest(workflow=_REPORT_WORKFLOW, event="schedule"), keys=keys, cap=1)

        self.assertTrue(decision.report)

    def test_cache_key_helpers(self) -> None:
        self.assertEqual(LaunchPolicy.cache_key(_FP, _NOW.date()), _KEY)
        self.assertEqual(LaunchPolicy.cache_key_prefix(_NOW.date()), "evergreen-launch-2026-10-06-")

    def test_rejects_non_positive_cap(self) -> None:
        with self.assertRaises(ValueError):
            LaunchPolicy(max_per_day=0)


if __name__ == "__main__":
    unittest.main()
