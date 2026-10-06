"""Unit tests for evergreen.launch_policy and evergreen.launch_target."""

from __future__ import annotations

import sys
import unittest
from datetime import date
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob, FailureDigest  # noqa: E402
from evergreen.launch_policy import LaunchDecision, LaunchPolicy  # noqa: E402
from evergreen.launch_target import DeliveryMode, LaunchTarget, LaunchTargetResolver  # noqa: E402

_TODAY = date(2026, 10, 6)
_FP = "abc123def456"
_KEY = f"evergreen-launch-2026-10-06-{_FP}"


def _digest(branch: str = "master", conclusion: str = "failure", jobs: int = 1) -> FailureDigest:
    return FailureDigest(
        repository="o/r",
        workflow_name="W",
        run_id=1,
        run_url="u",
        event="push",
        conclusion=conclusion,
        head_branch=branch,
        head_sha="s",
        failed_jobs=[FailedJob(name=f"j{i}", failed_steps=[], error_lines=[], url="") for i in range(jobs)],
    )


class TestLaunchTargetResolver(unittest.TestCase):
    def test_trunk_resolves_to_pull_request_mode(self) -> None:
        target = LaunchTargetResolver().resolve("master")

        self.assertEqual(target, LaunchTarget("master", DeliveryMode.PULL_REQUEST))
        self.assertTrue(target.auto_create_pr)
        self.assertFalse(target.work_on_current_branch)

    def test_bugsmash_resolves_to_push_mode(self) -> None:
        target = LaunchTargetResolver().resolve("bugsmash")

        self.assertEqual(target, LaunchTarget("bugsmash", DeliveryMode.PUSH_TO_BRANCH))
        self.assertFalse(target.auto_create_pr)
        self.assertTrue(target.work_on_current_branch)

    def test_other_branches_are_out_of_scope(self) -> None:
        resolver = LaunchTargetResolver()

        self.assertIsNone(resolver.resolve("RC34"))
        self.assertIsNone(resolver.resolve("cursor/understand-use-wave-at-dc80"))
        self.assertIsNone(resolver.resolve(""))


class TestLaunchPolicy(unittest.TestCase):
    def _decide(self, digest: FailureDigest, bodies: list[str] | None = None, keys: list[str] | None = None, cap: int = 6) -> LaunchDecision:
        return LaunchPolicy(max_per_day=cap).decide(digest, _FP, _TODAY, bodies or [], keys or [])

    def test_launches_trunk_failure_with_clean_state(self) -> None:
        decision = self._decide(_digest())

        self.assertTrue(decision.launch)
        self.assertEqual(decision.reason, "launch")
        self.assertEqual(decision.fingerprint, _FP)
        self.assertEqual(decision.cache_key, _KEY)
        self.assertEqual(decision.starting_ref, "master")
        self.assertEqual(decision.delivery_mode, "pull_request")
        self.assertEqual(decision.launches_today, 0)
        self.assertEqual(decision.to_dict()["cache_key"], _KEY)

    def test_skips_non_failure_conclusions(self) -> None:
        decision = self._decide(_digest(conclusion="cancelled"))

        self.assertFalse(decision.launch)
        self.assertIn("'cancelled'", decision.reason)
        self.assertEqual(decision.starting_ref, "")

    def test_skips_when_no_failed_jobs(self) -> None:
        decision = self._decide(_digest(jobs=0))

        self.assertFalse(decision.launch)
        self.assertEqual(decision.reason, "no failed jobs in the run")

    def test_skips_out_of_scope_branch(self) -> None:
        decision = self._decide(_digest(branch="RC34"))

        self.assertFalse(decision.launch)
        self.assertIn("outside Evergreen scope", decision.reason)

    def test_skips_when_fingerprint_launched_today(self) -> None:
        # Build the second id via cache_key so a mixed-entropy literal is not adjacent to
        # ``keys=`` / ``_KEY`` — gitleaks generic-api-key matches that identifier shape.
        other_today = LaunchPolicy.cache_key("other", _TODAY)

        decision = self._decide(_digest(), keys=[_KEY, other_today])

        self.assertFalse(decision.launch)
        self.assertIn("already launched", decision.reason)
        self.assertEqual(decision.launches_today, 2)
        self.assertEqual(decision.delivery_mode, "pull_request")

    def test_skips_when_open_pr_carries_fingerprint(self) -> None:
        bodies = ["unrelated", f"Fix things\n\nEvergreen-Fingerprint: {_FP}\n", None]  # type: ignore[list-item]

        decision = self._decide(_digest(), bodies=bodies)

        self.assertFalse(decision.launch)
        self.assertIn("open PR", decision.reason)

    def test_prefix_match_on_fingerprint_does_not_count_as_open_pr(self) -> None:
        decision = self._decide(_digest(), bodies=[f"Evergreen-Fingerprint: {_FP}zz"])

        # A longer fingerprint that merely starts with ours is a different root cause.
        self.assertTrue(decision.launch)

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

    def test_cache_key_helpers(self) -> None:
        self.assertEqual(LaunchPolicy.cache_key(_FP, _TODAY), _KEY)
        self.assertEqual(LaunchPolicy.cache_key_prefix(_TODAY), "evergreen-launch-2026-10-06-")

    def test_rejects_non_positive_cap(self) -> None:
        with self.assertRaises(ValueError):
            LaunchPolicy(max_per_day=0)


if __name__ == "__main__":
    unittest.main()
