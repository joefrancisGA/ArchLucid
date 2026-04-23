"""Unit tests for assert_controller_mutations_have_audit.py."""

from __future__ import annotations

import pathlib
import tempfile
import unittest

import assert_controller_mutations_have_audit as sut


class AssertControllerMutationsHaveAuditTests(unittest.TestCase):
    def test_flags_http_post_without_log_async(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            ctrl = root / "ArchLucid.Api" / "Controllers" / "Sample" / "SampleController.cs"
            ctrl.parent.mkdir(parents=True)
            ctrl.write_text(
                """
namespace ArchLucid.Api.Controllers.Sample;

public sealed class SampleController
{
    [HttpPost("x")]
    public Task<IActionResult> Mutate()
    {
        return Task.CompletedTask;
    }
}
""",
                encoding="utf-8",
            )

            violations = sut._scan_file(ctrl)
            fq = [v[0] for v in violations]
            self.assertIn("ArchLucid.Api.Controllers.Sample.SampleController.Mutate", fq)

    def test_passes_when_log_async_present(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            ctrl = root / "ArchLucid.Api" / "Controllers" / "Sample" / "SampleController.cs"
            ctrl.parent.mkdir(parents=True)
            ctrl.write_text(
                """
namespace ArchLucid.Api.Controllers.Sample;

public sealed class SampleController
{
    [HttpPost("x")]
    public async Task<IActionResult> Mutate()
    {
        await _audit.LogAsync(null, default);
        return null;
    }
}
""",
                encoding="utf-8",
            )

            violations = sut._scan_file(ctrl)
            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
