"""Unit tests for write_sql_backup_verification_artifact."""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_FIXTURE = _REPO / "scripts" / "ci" / "fixtures" / "tfplan-sql-backup-verified.sample.json"

_SPEC = importlib.util.spec_from_file_location(
    "write_sql_backup_verification_artifact",
    _REPO / "scripts" / "ci" / "write_sql_backup_verification_artifact.py",
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("Could not load write_sql_backup_verification_artifact.py")
_mod = importlib.util.module_from_spec(_SPEC)
sys.modules["write_sql_backup_verification_artifact"] = _mod
_SPEC.loader.exec_module(_mod)

build_verification_artifact = _mod.build_verification_artifact
main = _mod.main


class TestWriteSqlBackupVerificationArtifact(unittest.TestCase):
    def test_build_verified_sample_fixture(self) -> None:
        plan = json.loads(_FIXTURE.read_text(encoding="utf-8"))
        artifact = build_verification_artifact(plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=False)

        self.assertTrue(artifact["verified"])
        self.assertEqual(artifact["primaryDataRegion"], "eastus")
        self.assertEqual(artifact["backupStorageRedundancy"], "Geo")
        self.assertEqual(artifact["databaseResourceCount"], 2)
        self.assertEqual(artifact["violations"], [])

    def test_main_writes_output_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "artifact.json"
            code = main([str(_FIXTURE), str(out)])

            self.assertEqual(code, 0)
            self.assertTrue(out.is_file())

            body = json.loads(out.read_text(encoding="utf-8"))
            self.assertTrue(body["verified"])


if __name__ == "__main__":
    unittest.main()
