"""Map the failing branch to how the agent should deliver its fix."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DeliveryMode(str, Enum):
    # Trunk is protected by rulesets, so fixes arrive as a PR the agent gets green.
    PULL_REQUEST = "pull_request"
    # bugsmash already has an open PR to master; the agent pushes onto it directly.
    PUSH_TO_BRANCH = "push_to_branch"


@dataclass(frozen=True)
class LaunchTarget:
    starting_ref: str
    delivery_mode: DeliveryMode

    @property
    def work_on_current_branch(self) -> bool:
        return self.delivery_mode is DeliveryMode.PUSH_TO_BRANCH

    @property
    def auto_create_pr(self) -> bool:
        return self.delivery_mode is DeliveryMode.PULL_REQUEST


class LaunchTargetResolver:
    """Decide the starting ref and delivery mode for a head branch.

    Branches outside the configured scope resolve to ``None`` so the policy can
    skip them; wave branches and release cuts are deliberately out of scope.
    """

    def __init__(
        self,
        trunk_branches: frozenset[str] = frozenset({"master", "main"}),
        push_branches: frozenset[str] = frozenset({"bugsmash"}),
    ) -> None:
        self._trunk_branches = trunk_branches
        self._push_branches = push_branches

    def resolve(self, head_branch: str) -> LaunchTarget | None:
        if head_branch in self._trunk_branches:
            return LaunchTarget(starting_ref=head_branch, delivery_mode=DeliveryMode.PULL_REQUEST)

        if head_branch in self._push_branches:
            return LaunchTarget(starting_ref=head_branch, delivery_mode=DeliveryMode.PUSH_TO_BRANCH)

        return None
