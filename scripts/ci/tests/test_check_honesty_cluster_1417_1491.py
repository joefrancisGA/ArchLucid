from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard(script_name: str, module_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(module_name, script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}.")
    sys.path.insert(0, str(_CI))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


DECIDE_ONCE_TRIAD = _load_guard(
    "check_decide_once_triad_honesty.py",
    "_check_decide_once_triad_honesty",
)
GDPR_ERASURE = _load_guard(
    "check_gdpr_erasure_append_only_honesty.py",
    "_check_gdpr_erasure_append_only_honesty",
)
OFFLINE_EXPORT = _load_guard(
    "check_offline_export_portability_honesty.py",
    "_check_offline_export_portability_honesty",
)
BACKUP_RESTORE = _load_guard(
    "check_evidence_backup_restore_honesty.py",
    "_check_evidence_backup_restore_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestDecideOnceTriadHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = DECIDE_ONCE_TRIAD.decide_once_triad_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_triad_closed_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                DECIDE_ONCE_TRIAD.CONTRACT_REL,
                [
                    "**TB-1416**",
                    "**TB-1417**",
                    "M-253",
                    "Explicit non-claims",
                    "CI anchors for **TB-1417**",
                    "INV-001",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "The INV-001 triad is fully closed for buyers.\n",
            )
            violations = DECIDE_ONCE_TRIAD.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("triad" in item.lower() for item in violations))


class TestGdprErasureAppendOnlyHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = GDPR_ERASURE.gdpr_erasure_append_only_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_immutable_forever_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                GDPR_ERASURE.CONTRACT_REL,
                [
                    "**TB-1470**",
                    "**TB-1471**",
                    "M-265",
                    "Too strong",
                    "CI anchors for **TB-1471**",
                    "TenantDeletionService",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Sealed evidence is immutable forever after offboard.\n",
            )
            violations = GDPR_ERASURE.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("forever" in item.lower() for item in violations))


class TestOfflineExportPortabilityHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = OFFLINE_EXPORT.offline_export_portability_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_fully_offline_manifesthash_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                OFFLINE_EXPORT.CONTRACT_REL,
                [
                    "**TB-1488**",
                    "**TB-1489**",
                    "M-267",
                    "Too strong",
                    "CI anchors for **TB-1489**",
                    "export-manifest.json",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Buyers get fully offline ManifestHash verification forever.\n",
            )
            violations = OFFLINE_EXPORT.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("offline" in item.lower() for item in violations))


class TestEvidenceBackupRestoreHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = BACKUP_RESTORE.evidence_backup_restore_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_append_only_survives_pitr_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                BACKUP_RESTORE.CONTRACT_REL,
                [
                    "**TB-1490**",
                    "**TB-1491**",
                    "M-269",
                    "Too strong",
                    "CI anchors for **TB-1491**",
                    "controlled discontinuity",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Append-only history survives PITR without discontinuity.\n",
            )
            violations = BACKUP_RESTORE.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("pitr" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
