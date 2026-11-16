import importlib.util
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "cancel-stale-pending-ci.yml"
SCRIPT_REL = "scripts/ci/cancel_stale_pending_ci_runs.py"


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

    def test_workflow_checks_out_repo_before_running_script(self) -> None:
        text = WORKFLOW_PATH.read_text(encoding="utf-8")
        checkout_at = text.find("actions/checkout@")
        script_at = text.find(SCRIPT_REL)

        self.assertNotEqual(
            checkout_at,
            -1,
            "scheduled cancel-stale workflow must check out the repo",
        )
        self.assertNotEqual(
            script_at,
            -1,
            "workflow must run cancel_stale_pending_ci_runs.py",
        )
        self.assertLess(
            checkout_at,
            script_at,
            "checkout must precede the script so the file exists on the runner",
        )


    def test_never_qualifies_latest_exact_head_even_if_pending_for_days(self) -> None:
        module = _load_module()
        now = datetime(2026, 11, 16, tzinfo=timezone.utc)
        run = self._run(now - timedelta(days=5))
        self.assertFalse(module.is_superseded_old_push(run, "current", now))

    def test_only_old_superseded_push_qualifies(self) -> None:
        module = _load_module()
        now = datetime(2026, 11, 16, tzinfo=timezone.utc)
        run = self._run(now - timedelta(minutes=91))
        self.assertTrue(module.is_superseded_old_push(run, "new-head", now))
        run["created_at"] = (now - timedelta(minutes=45)).isoformat()
        self.assertFalse(module.is_superseded_old_push(run, "new-head", now))
        run["created_at"] = "invalid"
        self.assertFalse(module.is_superseded_old_push(run, "new-head", now))
        run["created_at"] = (now - timedelta(days=3)).isoformat()
        for event in ("workflow_dispatch", "pull_request"):
            run["event"] = event
            self.assertFalse(module.is_superseded_old_push(run, "new-head", now))
        run["event"] = "push"
        run["status"] = "in_progress"
        self.assertFalse(module.is_superseded_old_push(run, "new-head", now))
        run["status"] = "pending"
        self.assertFalse(module.is_superseded_old_push(run, None, now))

    def test_main_never_cancels_exact_head_pending_run_with_zero_jobs(self) -> None:
        module = _load_module()
        run = self._run(datetime.now(timezone.utc) - timedelta(days=1))

        def api(path):
            if "?status=pending" in path:
                return {"workflow_runs": [run]} if path.endswith("&page=1") else {"workflow_runs": []}
            if "/branches/RC46" in path:
                return {"commit": {"sha": "current"}}
            raise AssertionError(f"Unexpected API call: {path}")

        with mock.patch.dict("os.environ", {"GITHUB_REPOSITORY": "org/repo", "DRY_RUN": "false"}):
            with mock.patch.object(module, "gh_api", side_effect=api):
                with mock.patch.object(module.subprocess, "check_call") as cancel:
                    module.main()
        cancel.assert_not_called()

    def test_main_revalidates_before_cancelling_obsolete_run(self) -> None:
        module = _load_module()
        run = self._run(datetime.now(timezone.utc) - timedelta(days=1))
        revalidated = dict(run, status="in_progress")

        def api(path):
            if "?status=pending" in path:
                return {"workflow_runs": [run]} if path.endswith("&page=1") else {"workflow_runs": []}
            if "/branches/RC46" in path:
                return {"commit": {"sha": "new-head"}}
            if path.endswith("/jobs"):
                return {"total_count": 0}
            if path.endswith("/runs/42"):
                return revalidated
            raise AssertionError(f"Unexpected API call: {path}")

        with mock.patch.dict("os.environ", {"GITHUB_REPOSITORY": "org/repo", "DRY_RUN": "false"}):
            with mock.patch.object(module, "gh_api", side_effect=api):
                with mock.patch.object(module.subprocess, "check_call") as cancel:
                    module.main()
        cancel.assert_not_called()

    def test_main_can_cancel_genuinely_superseded_old_zero_job_push(self) -> None:
        module = _load_module()
        run = self._run(datetime.now(timezone.utc) - timedelta(days=1))

        def api(path):
            if "?status=pending" in path:
                return {"workflow_runs": [run]} if path.endswith("&page=1") else {"workflow_runs": []}
            if "/branches/RC46" in path:
                return {"commit": {"sha": "new-head"}}
            if path.endswith("/jobs"):
                return {"total_count": 0}
            if path.endswith("/runs/42"):
                return run
            raise AssertionError(f"Unexpected API call: {path}")

        with mock.patch.dict("os.environ", {"GITHUB_REPOSITORY": "org/repo", "DRY_RUN": "false"}):
            with mock.patch.object(module, "gh_api", side_effect=api):
                with mock.patch.object(module.subprocess, "check_call") as cancel:
                    module.main()
        cancel.assert_called_once_with(
            ["gh", "api", "--method", "POST", "repos/org/repo/actions/runs/42/cancel"]
        )

    @staticmethod
    def _run(created_at: datetime) -> dict:
        return {
            "name": "CI", "id": 42, "head_branch": "RC46", "head_sha": "current",
            "event": "push", "status": "pending", "created_at": created_at.isoformat(),
        }

if __name__ == "__main__":
    unittest.main()
