"""Route a failed workflow to repair or report-only handling."""

from __future__ import annotations

from evergreen.workflow_route import WorkflowRoute

# Workflows where a red run usually means "a threshold, baseline or finding needs a human call", not
# "code is broken". An agent would tend to loosen the threshold, which is exactly what must not happen
# unattended. Every name must also appear in the `workflows:` trigger list of evergreen-agent.yml;
# test_evergreen_workflow_router.py enforces that.
REPORT_ONLY_WORKFLOWS: frozenset[str] = frozenset(
    {
        "Performance: k6 per-tenant burst (scheduled)",
        "Performance: k6 production-like (scheduled)",
        "Performance: k6 soak (scheduled)",
        "Security: ZAP baseline (scheduled, strict visibility)",
        "Security: Schemathesis API fuzz (scheduled)",
        "Stryker (scheduled)",
        "Deep regression (optional)",
        "Trunk matrix measurement",
    }
)


class WorkflowRouter:
    """Everything not listed as report-only is repaired; trunk gates are the default."""

    def __init__(self, report_only: frozenset[str] = REPORT_ONLY_WORKFLOWS) -> None:
        self._report_only = report_only

    def route(self, workflow_name: str) -> WorkflowRoute:
        if workflow_name in self._report_only:
            return WorkflowRoute.REPORT

        return WorkflowRoute.REPAIR
