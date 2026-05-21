"""Smoke test: route/tier/policy/nav registry check runs cleanly."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from assert_route_tier_policy_nav import MATRIX_APPENDIX_HEADING, repo_root, run_check, run_sync


_SAMPLE_CONTROLLER = '''\
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Sample;

[ApiController]
[Authorize(Policy = "ReadAuthority")]
[Route("v{version:apiVersion}/sample")]
public sealed class SampleController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok();
}
'''

_MATRIX_HEAD = '''\
# Route matrix

## Single source of truth order

1. Code

''' + MATRIX_APPENDIX_HEADING + '''

| old | row |
| --- | --- |
'''


class TestAssertRouteTierPolicyNav(unittest.TestCase):
    def test_run_check_succeeds_in_repo(self) -> None:
        root = repo_root()
        self.assertTrue((root / "ArchLucid.Api").is_dir())

        errors = run_check(root)
        self.assertEqual(errors, [], msg=";\n".join(errors))

    def test_run_sync_materializes_missing_controller(self) -> None:
        with tempfile.TemporaryDirectory() as raw_tmp:
            root = Path(raw_tmp)
            controllers_dir = root / "ArchLucid.Api" / "Controllers" / "Sample"
            controllers_dir.mkdir(parents=True)
            (controllers_dir / "SampleController.cs").write_text(_SAMPLE_CONTROLLER, encoding="utf-8")

            data_dir = root / "scripts" / "ci" / "data"
            data_dir.mkdir(parents=True)
            (data_dir / "route_tier_policy_nav_overrides.json").write_text(
                json.dumps(
                    {
                        "exemption_by_controller_file": {},
                        "nav_operator_href_by_controller_file": {},
                    }
                ),
                encoding="utf-8",
            )
            (data_dir / "route_tier_policy_nav_registry.json").write_text(
                json.dumps({"version": 1, "entries": []}),
                encoding="utf-8",
            )

            matrix_path = root / "docs" / "library" / "ROUTE_TIER_POLICY_NAV_MATRIX.md"
            matrix_path.parent.mkdir(parents=True)
            matrix_path.write_text(_MATRIX_HEAD, encoding="utf-8")

            errors = run_sync(root)
            self.assertEqual(errors, [], msg=";\n".join(errors))

            registry = json.loads((data_dir / "route_tier_policy_nav_registry.json").read_text(encoding="utf-8"))
            self.assertEqual(len(registry["entries"]), 1)
            self.assertEqual(registry["entries"][0]["controller_file"], "Sample/SampleController.cs")

            matrix_text = matrix_path.read_text(encoding="utf-8")
            self.assertIn("Sample/SampleController.cs", matrix_text)
            self.assertIn("<!-- route-tier-policy-nav-registry-count:1 -->", matrix_text)


if __name__ == "__main__":
    unittest.main()
