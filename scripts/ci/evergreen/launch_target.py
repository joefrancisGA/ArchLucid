"""Map the failing branch to how the agent should deliver its fix."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from evergreen.lane import Lane

# GitHub Actions reports scheduled runs with this event name.
SCHEDULE_EVENT = "schedule"


class DeliveryMode(str, Enum):
    # Trunk is protected by rulesets, so fixes arrive as a PR the agent gets green.
    PULL_REQUEST = "pull_request"
    # bugsmash and Dependabot branches already have an open PR; the agent pushes onto it directly.
    PUSH_TO_BRANCH = "push_to_branch"


@dataclass(frozen=True)
class LaunchTarget:
    starting_ref: str
    delivery_mode: DeliveryMode
    lane: Lane = Lane.TRUNK_GATE

    @property
    def work_on_current_branch(self) -> bool:
        return self.delivery_mode is DeliveryMode.PUSH_TO_BRANCH

    @property
    def auto_create_pr(self) -> bool:
        return self.delivery_mode is DeliveryMode.PULL_REQUEST


class LaunchTargetResolver:
    """Decide the starting ref, delivery mode and lane for a head branch.

    Branches outside the configured scope resolve to ``None`` so the policy can
    skip them; wave branches and release cuts are deliberately out of scope.
    """

    def __init__(
        self,
        trunk_branches: frozenset[str] = frozenset({"master", "main"}),
        push_branches: frozenset[str] = frozenset({"bugsmash"}),
        dependabot_prefix: str = "dependabot/",
    ) -> None:
        self._trunk_branches = trunk_branches
        self._push_branches = push_branches
        self._dependabot_prefix = dependabot_prefix

    def resolve(self, head_branch: str, event: str = "") -> LaunchTarget | None:
        if head_branch in self._trunk_branches:
            lane: Lane = Lane.SCHEDULED if event == SCHEDULE_EVENT else Lane.TRUNK_GATE
            return LaunchTarget(starting_ref=head_branch, delivery_mode=DeliveryMode.PULL_REQUEST, lane=lane)

        if head_branch in self._push_branches:
            return LaunchTarget(starting_ref=head_branch, delivery_mode=DeliveryMode.PUSH_TO_BRANCH, lane=Lane.BUGSMASH)

        if head_branch.startswith(self._dependabot_prefix):
            return LaunchTarget(starting_ref=head_branch, delivery_mode=DeliveryMode.PUSH_TO_BRANCH, lane=Lane.DEPENDABOT)

        return None
