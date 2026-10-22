"""Unit tests for evergreen.workflow_router, plus a guard that the workflow trigger list matches it."""

from __future__ import annotations

import sys
import unittest
import re
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.workflow_route import WorkflowRoute  # noqa: E402
from evergreen.workflow_router import REPORT_ONLY_WORKFLOWS, WorkflowRouter  # noqa: E402

_WORKFLOW_FILE = _CI_ROOT.parent.parent / ".github" / "workflows" / "evergreen-agent.yml"


def _triggered_workflow_names() -> list[str]:
    """Read the quoted names under ``on.workflow_run.workflows`` without needing a YAML parser."""
    text: str = _WORKFLOW_FILE.read_text(encoding="utf-8")
    block: str = text.split("workflows:", 1)[1].split("types:", 1)[0]
    return re.findall(r'^\s*-\s+"([^"]+)"\s*$', block, flags=re.MULTILINE)


class TestWorkflowRouter(unittest.TestCase):
    def test_report_only_workflows_route_to_report(self) -> None:
        router = WorkflowRouter()

        for name in REPORT_ONLY_WORKFLOWS:
            self.assertIs(router.route(name), WorkflowRoute.REPORT, name)

    def test_everything_else_is_repaired(self) -> None:
        router = WorkflowRouter()

        self.assertIs(router.route("UI typecheck on push"), WorkflowRoute.REPAIR)
        self.assertIs(router.route("golden-cohort-nightly"), WorkflowRoute.REPAIR)
        self.assertIs(router.route(""), WorkflowRoute.REPAIR)

    def test_custom_report_set(self) -> None:
        self.assertIs(WorkflowRouter(frozenset({"X"})).route("X"), WorkflowRoute.REPORT)


class TestWorkflowTriggerList(unittest.TestCase):
    def test_trigger_list_is_parsed(self) -> None:
        names = _triggered_workflow_names()

        self.assertIn("UI typecheck on push", names)
        self.assertEqual(len(names), len(set(names)), "duplicate workflow in the trigger list")

    def test_every_report_only_workflow_is_actually_triggered(self) -> None:
        missing = sorted(REPORT_ONLY_WORKFLOWS - set(_triggered_workflow_names()))

        self.assertEqual(missing, [], "report-only workflows that Evergreen is never triggered by")

    def test_every_triggered_workflow_exists_with_that_exact_name(self) -> None:
        workflows_dir = _WORKFLOW_FILE.parent
        declared: set[str] = set()

        for path in workflows_dir.glob("*.yml"):
            match = re.search(r'^name:\s*"?([^"\n]+?)"?\s*$', path.read_text(encoding="utf-8"), flags=re.MULTILINE)

            if match:
                declared.add(match.group(1))

        unknown = sorted(set(_triggered_workflow_names()) - declared)

        self.assertEqual(unknown, [], "workflow_run names that match no workflow file's `name:`")


if __name__ == "__main__":
    unittest.main()
