"""What Evergreen does with a failed workflow: repair it with an agent, or only report it."""

from __future__ import annotations

from enum import Enum


class WorkflowRoute(str, Enum):
    # An agent reproduces the failure and opens a PR.
    REPAIR = "repair"
    # A GitHub issue carries the digest; no agent runs. For failures that need an owner's judgement
    # (performance baselines, security scan triage, mutation score thresholds).
    REPORT = "report"
