"""Decide whether a failed run should launch an Evergreen agent."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from datetime import date
from typing import Any

from evergreen.failure_digest import FailureDigest
from evergreen.launch_target import LaunchTarget, LaunchTargetResolver

# Marker the agent must place in its PR body; it is the cross-day dedupe key.
PR_BODY_MARKER_PREFIX = "Evergreen-Fingerprint:"
CACHE_KEY_PREFIX = "evergreen-launch"


@dataclass(frozen=True)
class LaunchDecision:
    launch: bool
    reason: str
    fingerprint: str
    cache_key: str
    starting_ref: str = ""
    delivery_mode: str = ""
    launches_today: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class LaunchPolicy:
    """Pure decision logic; all external state is passed in by the caller.

    Order of checks matters: cheap structural filters first, then the dedupe
    checks that needed API calls, then the daily budget.
    """

    def __init__(
        self,
        max_per_day: int,
        target_resolver: LaunchTargetResolver | None = None,
    ) -> None:
        if max_per_day <= 0:
            raise ValueError("max_per_day must be positive")

        self._max_per_day = max_per_day
        self._target_resolver = target_resolver or LaunchTargetResolver()

    @staticmethod
    def cache_key(fingerprint: str, today: date) -> str:
        return f"{CACHE_KEY_PREFIX}-{today.isoformat()}-{fingerprint}"

    @staticmethod
    def cache_key_prefix(today: date) -> str:
        return f"{CACHE_KEY_PREFIX}-{today.isoformat()}-"

    def decide(
        self,
        digest: FailureDigest,
        fingerprint: str,
        today: date,
        open_pr_bodies: list[str],
        todays_cache_keys: list[str],
    ) -> LaunchDecision:
        key: str = self.cache_key(fingerprint, today)
        launches_today: int = len(todays_cache_keys)

        def skip(reason: str, target: LaunchTarget | None = None) -> LaunchDecision:
            return self._decision(False, reason, fingerprint, key, target, launches_today)

        if digest.conclusion != "failure":
            return skip(f"conclusion is '{digest.conclusion}', not 'failure'")

        if not digest.failed_jobs:
            return skip("no failed jobs in the run")

        target: LaunchTarget | None = self._target_resolver.resolve(digest.head_branch)

        if target is None:
            return skip(f"branch '{digest.head_branch}' is outside Evergreen scope")

        if key in todays_cache_keys:
            return skip("an agent was already launched for this fingerprint today", target)

        if self._has_open_pr(fingerprint, open_pr_bodies):
            return skip("an open PR already carries this fingerprint", target)

        if launches_today >= self._max_per_day:
            return skip(f"daily cap reached ({launches_today}/{self._max_per_day})", target)

        return self._decision(True, "launch", fingerprint, key, target, launches_today)

    @staticmethod
    def _has_open_pr(fingerprint: str, open_pr_bodies: list[str]) -> bool:
        # Word boundary so a longer fingerprint that merely starts with ours does not match.
        marker = re.compile(rf"{re.escape(PR_BODY_MARKER_PREFIX)}\s*{re.escape(fingerprint)}\b")
        return any(marker.search(body or "") for body in open_pr_bodies)

    @staticmethod
    def _decision(
        launch: bool,
        reason: str,
        fingerprint: str,
        key: str,
        target: LaunchTarget | None,
        launches_today: int,
    ) -> LaunchDecision:
        return LaunchDecision(
            launch=launch,
            reason=reason,
            fingerprint=fingerprint,
            cache_key=key,
            starting_ref=target.starting_ref if target else "",
            delivery_mode=target.delivery_mode.value if target else "",
            launches_today=launches_today,
        )
