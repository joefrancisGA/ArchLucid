"""Render the Cloud Agent prompt from a digest and a launch decision."""

from __future__ import annotations

from pathlib import Path

from evergreen import markers
from evergreen.failure_digest import FailureDigest
from evergreen.failure_sections import failed_jobs_section
from evergreen.lane import Lane
from evergreen.launch_policy import LaunchDecision
from evergreen.launch_target import DeliveryMode

_DEFAULT_TEMPLATE = Path(__file__).with_name("prompt_template.md")

_DELIVERY_INSTRUCTIONS: dict[DeliveryMode, str] = {
    DeliveryMode.PULL_REQUEST: (
        "Work on a new `cursor/evergreen-*` branch from `{starting_ref}`. Open a pull request to "
        "`{starting_ref}`, apply the `evergreen` label, then run the `fix-ci` loop until every check "
        "on the PR is green. Do not merge; the owner merges Evergreen PRs."
    ),
    DeliveryMode.PUSH_TO_BRANCH: (
        "Commit directly on `{starting_ref}` (it already has an open pull request) and push. Then "
        "watch that pull request's checks and keep fixing until they are green."
    ),
}

# Lane-specific scope, spelled out in the SOP sections named here.
_LANE_INSTRUCTIONS: dict[Lane, str] = {
    Lane.TRUNK_GATE: "This is a trunk gate. Follow SOP Phases 0-6 as written.",
    Lane.SCHEDULED: (
        "This is a **scheduled** workflow (nightly or weekly) that failed on trunk. Follow the SOP section "
        "'Scheduled lane': first decide whether the failure is a flake or infrastructure outage (re-dispatch "
        "once; if it passes, report flake and stop), and never loosen a threshold, baseline or schedule to go green."
    ),
    Lane.BUGSMASH: "This is the `bugsmash` branch. Follow SOP Phases 0-6 in push mode.",
    Lane.DEPENDABOT: (
        "This is a **Dependabot** dependency-update branch. Follow the SOP section 'Dependabot lane': adapt the "
        "code to the upgrade, never revert, pin, ignore or override the dependency to get green, and escalate "
        "with a PR comment when the upgrade needs a product decision."
    ),
}


class PromptRenderer:
    """Fill the Markdown template; the template owns the wording, this class owns the data."""

    def __init__(self, template_path: Path | None = None) -> None:
        self._template: str = (template_path or _DEFAULT_TEMPLATE).read_text(encoding="utf-8")

    def render(self, digest: FailureDigest, decision: LaunchDecision) -> str:
        mode: DeliveryMode = DeliveryMode(decision.delivery_mode)
        lane: Lane = Lane(decision.lane or Lane.TRUNK_GATE.value)
        return self._template.format(
            repository=digest.repository,
            workflow_name=digest.workflow_name,
            run_url=digest.run_url,
            event=digest.event,
            head_branch=digest.head_branch,
            head_sha=digest.head_sha,
            pull_request_line=self._pull_request_line(digest),
            fingerprint=decision.fingerprint,
            family=decision.family,
            marker_lines=markers.render(decision.fingerprint, decision.family),
            lane=lane.value,
            lane_instructions=_LANE_INSTRUCTIONS[lane],
            delivery_mode=mode.value,
            starting_ref=decision.starting_ref,
            failed_jobs_section=failed_jobs_section(digest.failed_jobs),
            delivery_instructions=_DELIVERY_INSTRUCTIONS[mode].format(starting_ref=decision.starting_ref),
        )

    @staticmethod
    def _pull_request_line(digest: FailureDigest) -> str:
        if not digest.pull_request_numbers:
            return ""

        numbers: str = ", ".join(f"#{n}" for n in digest.pull_request_numbers)
        return f" (pull request {numbers})"
