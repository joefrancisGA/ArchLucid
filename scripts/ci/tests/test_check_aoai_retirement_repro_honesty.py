from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_aoai_retirement_repro_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_aoai_retirement_repro_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load AOAI retirement repro honesty guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_contract(root: Path) -> None:
    path = root / G.CONTRACT_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "**Status:** **Done** (TB-1499)",
                "artifact and regenerate stored-source replay.",
                "auto-upgrade quiet-false.",
                "TB-1172 rubber stamp forbidden.",
                "TB-1024 comparison snapshot.",
                "Bit-identical Real re-execution is not promised.",
            ]
        ),
        encoding="utf-8",
    )


def _write_procurement_packet(root: Path) -> None:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "## AOAI {#aoai-model-retirement-repro-m-274}",
                "TB-1499 engineering map.",
                "Do not promise Bit-identical Real re-execution forever.",
                "Auto-upgrade preserves ManifestHash identity is too strong.",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_targets(root: Path, *, body: str) -> None:
    _write_contract(root)
    _write_procurement_packet(root)

    for rel in G.DOCS_TO_SCAN:
        if rel.as_posix() == "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md":
            continue

        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


class TestAoaiRetirementReproHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.aoai_retirement_repro_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_safe_fixture_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Do not claim bit-identical re-execute forever after model retirement.\n",
            )

            self.assertEqual(G.aoai_retirement_repro_honesty_violations(root), [])

    def test_bit_identical_forever_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="ArchLucid guarantees bit-identical re-execution forever on every Real run.\n",
            )

            violations = G.aoai_retirement_repro_honesty_violations(root)

            self.assertTrue(any("bit-identical" in violation for violation in violations))

    def test_auto_upgrade_manifesthash_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Auto-upgrade preserves ManifestHash continuity for committed packages.\n",
            )

            violations = G.aoai_retirement_repro_honesty_violations(root)

            self.assertTrue(any("Auto-upgrade" in violation for violation in violations))

    def test_replay_proves_same_model_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Comparison replay proves the same model pin is still live.\n",
            )

            violations = G.aoai_retirement_repro_honesty_violations(root)

            self.assertTrue(any("Comparison replay" in violation for violation in violations))

    def test_allowlist_marker_skips_violation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Auto-upgrade preserves ManifestHash continuity. aoai-retirement-repro-honesty: allow\n",
            )

            self.assertEqual(G.aoai_retirement_repro_honesty_violations(root), [])


if __name__ == "__main__":
    unittest.main()
