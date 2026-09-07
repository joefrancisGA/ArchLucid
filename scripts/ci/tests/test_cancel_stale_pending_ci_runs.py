import importlib.util
import unittest
from pathlib import Path
from unittest import mock


def _load_module():
    path = Path(__file__).resolve().parents[1] / "cancel_stale_pending_ci_runs.py"
    spec = importlib.util.spec_from_file_location("cancel_stale_pending_ci_runs", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class CancelStalePendingCiRunsTests(unittest.TestCase):
    def test_default_workflow_names_include_trunk_smoke_workflows(self) -> None:
        module = _load_module()

        self.assertIn("CI", module.DEFAULT_WORKFLOW_NAMES)
        self.assertIn("UI typecheck on push", module.DEFAULT_WORKFLOW_NAMES)
        self.assertIn("Private-beta access on push", module.DEFAULT_WORKFLOW_NAMES)

    def test_resolve_workflow_names_honors_env_override(self) -> None:
        module = _load_module()

        with mock.patch.dict("os.environ", {"WORKFLOW_NAMES": "CI,Custom workflow"}, clear=False):
            names = module.resolve_workflow_names()

        self.assertEqual(names, frozenset({"CI", "Custom workflow"}))


if __name__ == "__main__":
    unittest.main()
