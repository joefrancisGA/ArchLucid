"""Tests for scripts/ci/check_starter_proof_packs.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _run_check(packs_root: Path) -> subprocess.CompletedProcess[str]:
    script = _repo_root() / "scripts" / "ci" / "check_starter_proof_packs.py"
    return subprocess.run(
        [sys.executable, str(script), "--packs-root", str(packs_root)],
        capture_output=True,
        text=True,
        check=False,
    )


def _write_valid_pack(packs_root: Path, *, chooser_body: str) -> None:
    pack = packs_root / "demo-pack"
    pack.mkdir()
    meta = {
        "id": "demo-pack",
        "title": "Demo",
        "targetBuyer": "Evaluator",
        "buyerJob": "Demo job",
        "owner": "Test",
        "lastReviewedUtc": "2026-05-29",
        "requiredInputs": ["second-run.json"],
        "expectedOutputs": ["checklist"],
        "scopeLabel": "V1-ready",
        "doNotUseWhen": ["Never for real PHI"],
        "deferredScopeNotes": "Not certification.",
    }
    (pack / "starter-pack.json").write_text(json.dumps(meta), encoding="utf-8")
    (pack / "architecture-request.json").write_text(
        '{"description":"synthetic demo no real costs"}',
        encoding="utf-8",
    )
    (pack / "second-run.json").write_text("{}", encoding="utf-8")
    (pack / "policy-context.json").write_text("{}", encoding="utf-8")
    (pack / "proof-package-checklist.md").write_text("# Checklist", encoding="utf-8")
    (pack / "README.md").write_text("# Demo", encoding="utf-8")
    (packs_root / "STARTER_PROOF_PACK_CHOOSER.md").write_text(chooser_body, encoding="utf-8")


class TestCheckStarterProofPacks(unittest.TestCase):
    def test_valid_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_valid_pack(
                root,
                chooser_body="# Chooser\nSee CORE_PILOT.md\n[demo-pack/](demo-pack/)",
            )

            result = _run_check(root)

            self.assertEqual(result.returncode, 0, result.stderr)

    def test_chooser_must_reference_packs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_valid_pack(root, chooser_body="# Chooser\nSee CORE_PILOT.md")

            result = _run_check(root)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("chooser does not reference pack folder", result.stderr)

    def test_missing_metadata_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack = root / "bad-pack"
            pack.mkdir()
            (pack / "starter-pack.json").write_text("{}", encoding="utf-8")
            (pack / "architecture-request.json").write_text('{"description":"synthetic demo"}', encoding="utf-8")
            (pack / "second-run.json").write_text("{}", encoding="utf-8")
            (pack / "policy-context.json").write_text("{}", encoding="utf-8")
            (pack / "proof-package-checklist.md").write_text("# Checklist", encoding="utf-8")
            (pack / "README.md").write_text("# Bad", encoding="utf-8")
            (root / "STARTER_PROOF_PACK_CHOOSER.md").write_text(
                "# Chooser\nSee CORE_PILOT.md\n[bad-pack/](bad-pack/)",
                encoding="utf-8",
            )

            result = _run_check(root)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing or empty", result.stderr)

    def test_repo_starter_packs_pass(self) -> None:
        root = _repo_root() / "templates" / "starter-proof-packs"
        result = _run_check(root)

        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
