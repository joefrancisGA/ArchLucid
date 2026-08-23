"""Unit tests for TB-882 nav authority / controller parity guard."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from check_nav_authority_controller_parity import (  # noqa: E402
    AUTHORITY_RANK,
    build_manifest_entries,
    parse_nav_link_authorities,
    parse_primary_get_policy,
    repo_root,
    run_check,
    run_sync,
)


_SAMPLE_CONTROLLER = """\
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArchLucid.Core.Authorization;

namespace ArchLucid.Api.Controllers.Sample;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[Route("v{version:apiVersion}/sample")]
public sealed class SampleController : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    public IActionResult List() => Ok();
}
"""

_PARTIAL_CONTROLLER_MAIN = """\
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArchLucid.Core.Authorization;

namespace ArchLucid.Api.Controllers.Governance;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[Route("v{version:apiVersion}/governance")]
public sealed partial class GovernanceController : ControllerBase
{
}
"""

_PARTIAL_CONTROLLER_INSIGHTS = """\
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpGet("dashboard")]
    public IActionResult GetDashboard() => Ok();
}
"""

_NAV_BUILDER = """\
import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

export class SampleNavGroupBuilder extends NavGroupBuilderBase {
  build() {
    return {
      id: "sample",
      label: "Sample",
      surface: "review-workflow",
      links: [
        {
          href: "/integrations/cloud-connections",
          label: "Cloud connections",
          title: "Cloud connections",
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
      ],
    };
  }
}
"""


class TestCheckNavAuthorityControllerParity(unittest.TestCase):
    def test_run_check_succeeds_in_repo(self) -> None:
        root = repo_root()
        errors = run_check(root)
        self.assertEqual(errors, [], msg=";\n".join(errors))

    def test_parse_primary_get_prefers_method_override(self) -> None:
        parsed = parse_primary_get_policy(_SAMPLE_CONTROLLER, "Sample/SampleController.cs")
        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.effective_policy, "ReadAuthority")
        self.assertEqual(parsed.method_name, "List")

    def test_parse_primary_get_merges_partial_controller_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            controllers = Path(tmp) / "Controllers" / "Governance"
            controllers.mkdir(parents=True)
            (controllers / "GovernanceController.cs").write_text(_PARTIAL_CONTROLLER_MAIN, encoding="utf-8")
            (controllers / "GovernanceController.Insights.cs").write_text(
                _PARTIAL_CONTROLLER_INSIGHTS,
                encoding="utf-8",
            )

            from check_nav_authority_controller_parity import (  # noqa: PLC0415
                _discover_controller_groups,
                _primary_get_from_group,
            )

            groups = _discover_controller_groups(controllers.parent)
            group = groups["Governance::GovernanceController"]
            parsed = _primary_get_from_group(group, controllers.parent)
            self.assertIsNotNone(parsed)
            assert parsed is not None
            self.assertEqual(parsed.effective_policy, "ReadAuthority")
            self.assertEqual(parsed.http_get_route, "dashboard")

    def test_parse_nav_link_authorities_reads_required_authority(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            ui_lib = Path(tmp)
            (ui_lib / "sample-nav-group-builder.ts").write_text(_NAV_BUILDER, encoding="utf-8")
            links = parse_nav_link_authorities(ui_lib)
            self.assertEqual(len(links), 1)
            self.assertEqual(links[0].href, "/integrations/cloud-connections")
            self.assertEqual(links[0].required_authority, "ExecuteAuthority")

    def test_authority_rank_monotonicity(self) -> None:
        self.assertLess(AUTHORITY_RANK["ReadAuthority"], AUTHORITY_RANK["ExecuteAuthority"])
        self.assertLess(AUTHORITY_RANK["ExecuteAuthority"], AUTHORITY_RANK["AdminAuthority"])

    def test_run_sync_is_idempotent_on_clean_tree(self) -> None:
        root = repo_root()
        errors = run_sync(root)
        self.assertEqual(errors, [])
        self.assertEqual(run_sync(root), [])


if __name__ == "__main__":
    unittest.main()
