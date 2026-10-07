"""Decide whether a failed run should launch an Evergreen agent, open a report issue, or be skipped."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, datetime
from typing import Any, Callable

from evergreen.failure_digest import FailureDigest
from evergreen.lane import Lane
from evergreen.launch_target import LaunchTarget, LaunchTargetResolver
from evergreen.markers import FINGERPRINT_MARKER
from evergreen.prior_work import PriorWork
from evergreen.prior_work_gate import PriorWorkGate
from evergreen.workflow_route import WorkflowRoute
from evergreen.workflow_router import WorkflowRouter

# Marker the agent must place in its PR body; it is the cross-day dedupe key.
PR_BODY_MARKER_PREFIX = FINGERPRINT_MARKER
CACHE_KEY_PREFIX = "evergreen-launch"

# Lanes whose failures are reported on trunk only; a report-only workflow failing on a Dependabot branch is noise.
_TRUNK_LANES: frozenset[Lane] = frozenset({Lane.TRUNK_GATE, Lane.SCHEDULED})

TrunkFailedJobs = Callable[[], set[str]]


@dataclass(frozen=True)
class LaunchDecision:
    launch: bool
    reason: str
    fingerprint: str
    cache_key: str
    starting_ref: str = ""
    delivery_mode: str = ""
    launches_today: int = 0
    report: bool = False
    lane: str = ""
    family: str = ""

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
        router: WorkflowRouter | None = None,
        gate: PriorWorkGate | None = None,
        disabled_lanes: frozenset[Lane] = frozenset(),
    ) -> None:
        if max_per_day <= 0:
            raise ValueError("max_per_day must be positive")

        self._max_per_day = max_per_day
        self._target_resolver = target_resolver or LaunchTargetResolver()
        self._router = router or WorkflowRouter()
        self._gate = gate or PriorWorkGate()
        self._disabled_lanes = disabled_lanes

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
        family: str,
        now: datetime,
        prior: PriorWork,
        todays_cache_keys: list[str],
        trunk_failed_jobs: TrunkFailedJobs | None = None,
    ) -> LaunchDecision:
        key: str = self.cache_key(fingerprint, now.date())
        launches_today: int = len(todays_cache_keys)

        def skip(reason: str, target: LaunchTarget | None = None) -> LaunchDecision:
            return self._decision(False, reason, fingerprint, family, key, target, launches_today)

        if digest.conclusion != "failure":
            return skip(f"conclusion is '{digest.conclusion}', not 'failure'")

        if not digest.failed_jobs:
            return skip("no failed jobs in the run")

        target: LaunchTarget | None = self._target_resolver.resolve(digest.head_branch, digest.event)

        if target is None:
            return skip(f"branch '{digest.head_branch}' is outside Evergreen scope")

        if target.lane in self._disabled_lanes:
            return skip(f"lane '{target.lane.value}' is disabled by EVERGREEN_DISABLED_LANES", target)

        route: WorkflowRoute = self._router.route(digest.workflow_name)

        if route is WorkflowRoute.REPAIR and key in todays_cache_keys:
            return skip("an agent was already launched for this fingerprint today", target)

        blocked: str | None = self._gate.blocking_reason(fingerprint, family, prior, now)

        if blocked is not None:
            return skip(blocked, target)

        if route is WorkflowRoute.REPORT:
            return self._report_decision(prior, fingerprint, family, key, target, launches_today)

        if target.lane is Lane.DEPENDABOT and self._fails_on_trunk(digest, trunk_failed_jobs):
            return skip("the same job is already failing on trunk; the trunk lane owns the repair", target)

        if launches_today >= self._max_per_day:
            return skip(f"daily cap reached ({launches_today}/{self._max_per_day})", target)

        return self._decision(True, "launch", fingerprint, family, key, target, launches_today)

    def _report_decision(
        self,
        prior: PriorWork,
        fingerprint: str,
        family: str,
        key: str,
        target: LaunchTarget,
        launches_today: int,
    ) -> LaunchDecision:
        if target.lane not in _TRUNK_LANES:
            return self._decision(
                False, "report-only workflows are reported on trunk only", fingerprint, family, key, target, launches_today
            )

        already: str | None = self._gate.issue_reason(fingerprint, prior)

        if already is not None:
            return self._decision(False, already, fingerprint, family, key, target, launches_today)

        return self._decision(
            False, "report-only workflow: opening an issue instead of launching an agent",
            fingerprint, family, key, target, launches_today, report=True,
        )

    @staticmethod
    def _fails_on_trunk(digest: FailureDigest, trunk_failed_jobs: TrunkFailedJobs | None) -> bool:
        if trunk_failed_jobs is None:
            return False

        on_trunk: set[str] = trunk_failed_jobs()
        return any(job.name in on_trunk for job in digest.failed_jobs)

    @staticmethod
    def _decision(
        launch: bool,
        reason: str,
        fingerprint: str,
        family: str,
        key: str,
        target: LaunchTarget | None,
        launches_today: int,
        report: bool = False,
    ) -> LaunchDecision:
        return LaunchDecision(
            launch=launch,
            reason=reason,
            fingerprint=fingerprint,
            cache_key=key,
            starting_ref=target.starting_ref if target else "",
            delivery_mode=target.delivery_mode.value if target else "",
            launches_today=launches_today,
            report=report,
            lane=target.lane.value if target else "",
            family=family,
        )
