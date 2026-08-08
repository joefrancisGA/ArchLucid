"""Unit tests for scripts/ci/check_api_latency_tiers.py (TB-2079)."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CI = ROOT / "scripts" / "ci"
SCRIPT = CI / "check_api_latency_tiers.py"
MANIFEST = CI / "data" / "api_latency_tiers.v1.json"


def load_checker():
    spec = importlib.util.spec_from_file_location("check_api_latency_tiers", SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    # dataclasses on Python 3.14 need the module registered before exec_module.
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def run_py(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class CheckApiLatencyTiersTests(unittest.TestCase):
    def test_manifest_exists_and_lists_execute_async(self) -> None:
        self.assertTrue(MANIFEST.is_file())
        payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
        ids = {row["id"] for row in payload["routes"]}
        self.assertIn("execute-async", ids)
        self.assertIn("replay-async", ids)
        self.assertEqual(1, payload["version"])

    def test_repo_gate_passes(self) -> None:
        result = run_py()
        self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)

    def test_intentional_tier_c_sync_regression_fixture_fails(self) -> None:
        result = run_py("--include-regression-fixture")
        self.assertEqual(1, result.returncode, msg=result.stdout or result.stderr)
        combined = (result.stderr or "") + (result.stdout or "")
        self.assertIn("bogus-long-async-regression", combined)
        self.assertIn("AsyncRequired", combined)

    def test_missing_async_sibling_is_detected(self) -> None:
        checker = load_checker()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            controllers = root / "ArchLucid.Api" / "Controllers"
            controllers.mkdir(parents=True)
            (controllers / "OnlySync.cs").write_text(
                """
using Microsoft.AspNetCore.Mvc;
namespace X;
[Route("v{version:apiVersion}/architecture")]
public class C : ControllerBase {
  [HttpPost("review/{runId}/execute")]
  public IActionResult E() => Ok();
}
""".strip(),
                encoding="utf-8",
            )
            data = root / "scripts" / "ci" / "data"
            data.mkdir(parents=True)
            manifest = {
                "version": 1,
                "routes": [
                    {
                        "id": "execute-sync",
                        "method": "POST",
                        "pathTemplate": "/v1/architecture/review/{runId}/execute",
                        "tier": "C",
                        "syncAllowedForSimulator": True,
                        "asyncSiblingId": "execute-async",
                    },
                    {
                        "id": "execute-async",
                        "method": "POST",
                        "pathTemplate": "/v1/architecture/review/{runId}/execute/async",
                        "tier": "C",
                        "requiresAccepted202": True,
                        "requiresAsyncRequiredAttribute": True,
                    },
                ],
                "tierCSyncPathAllowlist": [
                    "POST /v1/architecture/review/{runId}/execute",
                ],
            }
            manifest_path = data / "api_latency_tiers.v1.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors = checker.run_checks(
                root=root,
                manifest_path=manifest_path,
                include_regression_fixture=False,
            )
            self.assertTrue(any("execute-async" in e for e in errors), msg=errors)


if __name__ == "__main__":
    unittest.main()
