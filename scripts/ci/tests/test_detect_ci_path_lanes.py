"""Tests for CI path-lane classification."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load(module_name: str, script_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(module_name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}")

    sys.path.insert(0, str(_CI))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


DETECT = _load("detect_ci_path_lanes", "detect_ci_path_lanes.py")


class DetectCiPathLanesTests(unittest.TestCase):
    def test_docs_only_skips_all_expensive_lanes(self) -> None:
        lanes = DETECT.classify_paths(["docs/library/FOO.md", "README.md"])

        self.assertFalse(lanes["run_openapi"])
        self.assertFalse(lanes["run_dotnet"])
        self.assertFalse(lanes["run_terraform"])
        self.assertFalse(lanes["force_all"])

    def test_ui_component_only_skips_dotnet_and_openapi(self) -> None:
        lanes = DETECT.classify_paths(
            ["archlucid-ui/src/components/operator-home/RunsDashboardRecentTab.tsx"]
        )

        self.assertFalse(lanes["run_openapi"])
        self.assertFalse(lanes["run_dotnet"])
        self.assertFalse(lanes["run_terraform"])

    def test_api_types_generated_triggers_openapi(self) -> None:
        lanes = DETECT.classify_paths(["archlucid-ui/src/lib/api-types.generated.ts"])

        self.assertTrue(lanes["run_openapi"])
        self.assertTrue(lanes["run_dotnet"])

    def test_core_change_triggers_openapi_and_dotnet(self) -> None:
        lanes = DETECT.classify_paths(["ArchLucid.Core/Configuration/Foo.cs"])

        self.assertTrue(lanes["run_openapi"])
        self.assertTrue(lanes["run_dotnet"])
        self.assertFalse(lanes["run_terraform"])

    def test_cli_only_triggers_dotnet_not_openapi(self) -> None:
        lanes = DETECT.classify_paths(["ArchLucid.Cli/Program.cs"])

        self.assertFalse(lanes["run_openapi"])
        self.assertTrue(lanes["run_dotnet"])
        self.assertFalse(lanes["run_terraform"])

    def test_infra_only_triggers_terraform(self) -> None:
        lanes = DETECT.classify_paths(["infra/terraform/main.tf"])

        self.assertFalse(lanes["run_openapi"])
        self.assertFalse(lanes["run_dotnet"])
        self.assertTrue(lanes["run_terraform"])

    def test_workflow_change_forces_all_lanes(self) -> None:
        lanes = DETECT.classify_paths([".github/workflows/ci.yml"])

        self.assertTrue(lanes["force_all"])
        self.assertTrue(lanes["run_openapi"])
        self.assertTrue(lanes["run_dotnet"])
        self.assertTrue(lanes["run_terraform"])

    def test_empty_diff_fail_open(self) -> None:
        lanes = DETECT.classify_paths([])

        self.assertTrue(lanes["run_openapi"])
        self.assertTrue(lanes["run_dotnet"])
        self.assertTrue(lanes["run_terraform"])
        self.assertEqual(lanes["reason"], "empty_or_unknown_diff_fail_open")

    def test_non_pull_request_forces_all_lanes(self) -> None:
        payload = DETECT.detect_ci_path_lanes(
            base_ref="origin/master",
            event_name="workflow_dispatch",
            root=_REPO,
        )

        self.assertTrue(payload["run_openapi"])
        self.assertTrue(payload["run_dotnet"])
        self.assertTrue(payload["run_terraform"])
        self.assertEqual(payload["reason"], "non_pull_request_full_lanes")

    def test_write_github_output_flags(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "github_output"
            DETECT.write_github_output(
                {
                    "run_openapi": True,
                    "run_dotnet": False,
                    "run_terraform": True,
                    "force_all": False,
                    "reason": "path_lanes",
                },
                out,
            )
            text = out.read_text(encoding="utf-8")

        self.assertIn("run_openapi=true", text)
        self.assertIn("run_dotnet=false", text)
        self.assertIn("run_terraform=true", text)
        self.assertIn("reason=path_lanes", text)

    def test_normalize_git_path_uses_forward_slashes(self) -> None:
        self.assertEqual(
            DETECT.normalize_git_path("ArchLucid.Core\\Foo.cs"),
            "ArchLucid.Core/Foo.cs",
        )


if __name__ == "__main__":
    unittest.main()
