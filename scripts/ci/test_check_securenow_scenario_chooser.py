"""Unit tests for scripts/ci/check_securenow_scenario_chooser.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_scenario_chooser import ROOT, validate


def _copy_scenario_tree(dest_root: Path) -> None:
    src_sn = ROOT / "docs/securenow"
    dest_sn = dest_root / "docs/securenow"
    dest_sn.mkdir(parents=True, exist_ok=True)
    for name in (
        "SCENARIO_CHOOSER.md",
        "EXECUTIVE_PROOF_PACKET_TEMPLATE.md",
        "FIXTURE_STORYBOARD.md",
        "BUYER_PROOF_DEMO.md",
    ):
        shutil.copy2(src_sn / name, dest_sn / name)
    shutil.copytree(src_sn / "scenario-packs", dest_sn / "scenario-packs")
    test_src = (
        ROOT
        / "ArchLucid.Application.Tests/InfraEvidence/SecureNowArchitectTwoSnapshotGoldenFixtureTests.cs"
    )
    test_dest_dir = dest_root / "ArchLucid.Application.Tests/InfraEvidence"
    test_dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(test_src, test_dest_dir / test_src.name)


class SecureNowScenarioChooserTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_broken_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_scenario_tree(root)
            chooser = root / "docs/securenow/SCENARIO_CHOOSER.md"
            text = chooser.read_text(encoding="utf-8")
            chooser.write_text(text.replace("FIXTURE_STORYBOARD.md", "missing-storyboard.md"), encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("broken link" in e for e in errors))

    def test_stripped_not_collected_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_scenario_tree(root)
            exec_path = root / "docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md"
            exec_path.write_text("NOT COLLECTED\n" * 2, encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("NOT COLLECTED" in e for e in errors))

    def test_pack_linking_starter_proof_packs_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_scenario_tree(root)
            starter = root / "templates/starter-proof-packs"
            starter.mkdir(parents=True, exist_ok=True)
            (starter / "README.md").write_text("readme", encoding="utf-8")
            pack = root / "docs/securenow/scenario-packs/public-storage-path.md"
            pack.write_text(
                pack.read_text(encoding="utf-8")
                + "\n[bad](../../../templates/starter-proof-packs/README.md)\n",
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("starter-proof-packs" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
