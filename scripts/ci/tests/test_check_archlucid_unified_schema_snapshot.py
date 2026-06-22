"""TB-066 ArchLucid_Unified_Schema.sql snapshot drift guards."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

import check_archlucid_unified_schema_snapshot as sut


class TestCheckArchlucidUnifiedSchemaSnapshot(unittest.TestCase):
    def test_tb_066_snapshot_matches_generator(self) -> None:
        self.assertEqual(sut.main(), 0)

    def test_tb_066_ci_wrappers_exist(self) -> None:
        self.assertTrue((ROOT / "scripts" / "ci" / "check_archlucid_unified_schema_snapshot.sh").is_file())
        self.assertTrue((ROOT / "scripts" / "ci" / "check_archlucid_unified_schema_snapshot.ps1").is_file())
        self.assertTrue((ROOT / "scripts" / "ci" / "update_archlucid_unified_schema_snapshot.sh").is_file())
        self.assertTrue((ROOT / "scripts" / "ci" / "update_archlucid_unified_schema_snapshot.ps1").is_file())

    def test_tb_066_generator_module_loads(self) -> None:
        generator = ROOT / "scripts" / "ci" / "build_archlucid_unified_schema_sql.py"
        spec = importlib.util.spec_from_file_location("build_unified_schema", generator)
        self.assertIsNotNone(spec)
        self.assertIsNotNone(spec.loader)

        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        master = (ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid.sql").read_text(encoding="utf-8")
        batches = mod.split_go_batches(master)
        kept = [batch for batch in batches if mod.batch_has_declarative_ddl(batch)]

        self.assertGreater(len(kept), 100)


if __name__ == "__main__":
    unittest.main()
