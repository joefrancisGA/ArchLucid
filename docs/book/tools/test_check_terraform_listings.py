"""Tests for check_terraform_listings.py. A fake runner stands in for terraform, so no network is needed."""

from __future__ import annotations

import contextlib
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path

from check_terraform_listings import (
    LAB_MODULE,
    LISTINGS,
    block_address,
    check_format,
    declared_addresses,
    main,
    partition,
    run_command,
    split_blocks,
    stage_snippet,
    validate,
)

LAB_MAIN = 'resource "azurerm_storage_account" "custdata" {\n  name = "x"\n}\n\ndata "azuread_user" "me" {}\n'
SNIPPET = "\n".join([
    "# Shared key off.",
    'resource "azurerm_storage_account" "custdata" {',
    "  shared_access_key_enabled = false",
    "}",
    "",
    'resource "azurerm_role_assignment" "reader" {',
    '  scope = "s"',
    "}",
    "# trailing comment",
    "",
])


class FakeRunner:
    """Records terraform calls and fails the first call whose subcommand is in ``fail``."""

    def __init__(self, fail: tuple[str, ...] = ()) -> None:
        self.fail = fail
        self.calls: list[tuple[list[str], Path, dict[str, str]]] = []

    def __call__(self, command: list[str], cwd: Path, env: dict[str, str]) -> tuple[int, str]:
        self.calls.append((command, cwd, env))

        return (1, f"{command[1]} broke\n") if command[1] in self.fail else (0, "")


class Parsing(unittest.TestCase):
    def test_block_address(self) -> None:
        self.assertEqual(block_address('resource "a_b" "c" {'), ("resource", "a_b", "c"))
        self.assertEqual(block_address('data "a" "b" {}'), ("data", "a", "b"))
        self.assertIsNone(block_address('variable "x" {'))

    def test_split_attaches_comments_and_drops_trailing_ones(self) -> None:
        blocks = split_blocks(SNIPPET)

        self.assertEqual([block.address for block in blocks],
                         [("resource", "azurerm_storage_account", "custdata"),
                          ("resource", "azurerm_role_assignment", "reader")])
        self.assertEqual(blocks[0].lines[0], "# Shared key off.")
        self.assertEqual(blocks[1].lines[0], "")

    def test_split_one_line_and_unaddressed_blocks(self) -> None:
        blocks = split_blocks('data "a" "b" {}\nlocals {\n  x = 1\n}\n')

        self.assertEqual([block.address for block in blocks], [("data", "a", "b"), None])

    def test_split_rejects_stray_lines(self) -> None:
        with self.assertRaisesRegex(ValueError, "line 1: expected a block opening"):
            split_blocks("tags = 1\n")

        with self.assertRaisesRegex(ValueError, "unterminated block"):
            split_blocks('resource "a" "b" {\n  x = 1\n')


class Staging(unittest.TestCase):
    def setUp(self) -> None:
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)
        self.lab = self.root / LAB_MODULE
        self.lab.mkdir(parents=True)
        (self.lab / "main.tf").write_text(LAB_MAIN, encoding="utf-8")
        (self.lab / ".terraform.lock.hcl").write_text("# lock\n", encoding="utf-8")
        (self.lab / "notes.md").write_text("not copied\n", encoding="utf-8")
        self.listings = self.root / LISTINGS
        self.listings.mkdir(parents=True)

    def tearDown(self) -> None:
        self.folder.cleanup()

    def test_declared_addresses(self) -> None:
        self.assertEqual(declared_addresses(self.lab), {("resource", "azurerm_storage_account", "custdata"),
                                                        ("data", "azuread_user", "me")})

    def test_partition(self) -> None:
        additions, overrides = partition(split_blocks(SNIPPET), declared_addresses(self.lab))

        self.assertIn("azurerm_role_assignment", additions)
        self.assertNotIn("custdata", additions)
        self.assertTrue(overrides.startswith("# Shared key off."))
        self.assertEqual(partition([], set()), ("", ""))

    def test_stage_snippet_writes_new_and_override_files(self) -> None:
        snippet = self.listings / "ch09-plan.tf"
        snippet.write_text(SNIPPET, encoding="utf-8")
        work = self.root / "work"

        stage_snippet(snippet, self.lab, work)

        self.assertEqual(sorted(path.name for path in work.iterdir()),
                         [".terraform.lock.hcl", "listing_ch09-plan.tf", "listing_ch09-plan_override.tf", "main.tf"])

    def test_stage_snippet_without_overrides(self) -> None:
        snippet = self.listings / "new.tf"
        snippet.write_text('resource "x" "y" {\n}\n', encoding="utf-8")
        (self.lab / ".terraform.lock.hcl").unlink()
        work = self.root / "work"

        stage_snippet(snippet, self.lab, work)

        self.assertEqual(sorted(path.name for path in work.iterdir()), ["listing_new.tf", "main.tf"])

    def test_stage_snippet_with_only_overrides(self) -> None:
        snippet = self.listings / "tag.tf"
        snippet.write_text('resource "azurerm_storage_account" "custdata" {\n  tags = {}\n}\n', encoding="utf-8")
        work = self.root / "work"

        stage_snippet(snippet, self.lab, work)

        self.assertFalse((work / "listing_tag.tf").exists())
        self.assertTrue((work / "listing_tag_override.tf").exists())

    def run_main(self, runner: FakeRunner) -> tuple[int, str]:
        output = io.StringIO()

        with contextlib.redirect_stdout(output):
            code = main(["--book-root", str(self.root), "--terraform", "tf"], runner=runner)

        return code, output.getvalue()

    def test_main_validates_snippets_and_modules(self) -> None:
        (self.listings / "a.tf").write_text(SNIPPET, encoding="utf-8")
        (self.listings / "tooling").mkdir()
        (self.listings / "tooling" / "main.tf").write_text('resource "x" "y" {\n}\n', encoding="utf-8")
        runner = FakeRunner()

        code, output = self.run_main(runner)

        self.assertEqual(code, 0)
        self.assertIn("check_terraform_listings: 2 listing(s), 0 problem(s)", output)
        self.assertEqual([call[0][1] for call in runner.calls], ["fmt", "init", "validate", "init", "validate"])
        self.assertNotEqual(runner.calls[1][2]["TF_DATA_DIR"], runner.calls[3][2]["TF_DATA_DIR"])

    def test_main_reports_every_failure(self) -> None:
        (self.listings / "a.tf").write_text(SNIPPET, encoding="utf-8")
        (self.listings / "bad.tf").write_text("stray = 1\n", encoding="utf-8")
        (self.listings / "tooling").mkdir()

        code, output = self.run_main(FakeRunner(fail=("fmt", "validate")))

        self.assertEqual(code, 1)
        self.assertIn("terraform fmt -check failed for:\nfmt broke", output)
        self.assertIn("a.tf: terraform validate failed:\nvalidate broke", output)
        self.assertIn("bad.tf: line 1: expected a block opening", output)
        self.assertIn("tooling/: terraform validate failed", output)
        self.assertIn("3 listing(s), 4 problem(s)", output)


class Commands(unittest.TestCase):
    def test_validate_stops_at_failed_init(self) -> None:
        runner = FakeRunner(fail=("init",))

        with tempfile.TemporaryDirectory() as folder:
            failure = validate("tf", Path(folder), Path(folder) / "data", runner)

        self.assertEqual(failure, "terraform init failed:\ninit broke")
        self.assertEqual(len(runner.calls), 1)

    def test_check_format_passes(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / LISTINGS).mkdir(parents=True)

            self.assertEqual(check_format(Path(folder), "tf", FakeRunner()), [])

    def test_run_command_captures_both_streams(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            code, output = run_command([sys.executable, "-c", "import sys; print('out'); sys.exit(3)"],
                                       Path(folder), dict(os.environ))

        self.assertEqual(code, 3)
        self.assertIn("out", output)


if __name__ == "__main__":
    unittest.main()
