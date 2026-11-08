"""Protect DbUp migration identity while rejecting newly introduced collisions."""
from __future__ import annotations

import importlib.util
import io
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "check_migration_numbering.py"
spec = importlib.util.spec_from_file_location("check_migration_numbering", SCRIPT)
assert spec is not None and spec.loader is not None
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class MigrationNumberingCompatibilityTests(unittest.TestCase):
    def run_guard(self, folder: Path) -> tuple[int, str]:
        output = io.StringIO()
        with patch.object(guard, "MIGRATIONS_DIR", str(folder)):
            with redirect_stdout(output), redirect_stderr(output):
                status = guard.main()
        return status, output.getvalue()

    def test_existing_repository_duplicates_match_frozen_git_blobs(self) -> None:
        status, output = self.run_guard(ROOT / "ArchLucid.Persistence" / "Migrations")
        self.assertEqual(0, status, output)
        self.assertEqual(14, output.count("[HISTORICAL R2]"), output)

    def test_new_duplicate_prefix_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            folder = Path(tempdir)
            (folder / "001_Seed.sql").write_text("-- seed\n", encoding="utf-8")
            (folder / "002_First.sql").write_text("-- first\n", encoding="utf-8")
            (folder / "002_Second.sql").write_text("-- second\n", encoding="utf-8")
            status, output = self.run_guard(folder)
            self.assertEqual(1, status)
            self.assertIn("R2 (duplicate prefix '002')", output)

    def test_modified_historical_collision_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            folder = Path(tempdir)
            (folder / "337_Runs_CreatedByUserId.sql").write_text("-- altered\n", encoding="utf-8")
            (folder / "337_WizardIntakeDrafts.sql").write_text("-- altered\n", encoding="utf-8")
            status, output = self.run_guard(folder)
            self.assertEqual(1, status)
            self.assertIn("R2 (duplicate prefix '337')", output)


if __name__ == "__main__":
    unittest.main()
