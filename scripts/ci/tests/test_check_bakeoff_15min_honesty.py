from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_bakeoff_15min_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_bakeoff_15min_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load bake-off honesty guard.")

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
                "**Status:** **Done** (TB-1456)",
                "Manual ARB / status-quo packaging loses first.",
                "Generic LLM loses second on packaging/audit only.",
                "EA tooling is complement / SoR — out of 15-min bake-off.",
                "M-42 seats cohort; M-20 measured kill frequency.",
                "goldenManifestId + sponsor export on package spine.",
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
                "## Bake-off {#bakeoff-15min-loser-sequence-m-262}",
                "TB-1457 honesty CI.",
                "Say manual ARB packaging loses first; EA is complement/SoR.",
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


class TestBakeoff15MinHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.bakeoff_15min_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_safe_fixture_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Do not claim LeanIX lost the 15-minute bake-off. Defer beats ChatGPT until M-42.\n",
            )

            self.assertEqual(G.bakeoff_15min_honesty_violations(root), [])

    def test_ea_fake_loss_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(root, body="LeanIX lost the 15-minute bake-off in our demo.\n")

            violations = G.bakeoff_15min_honesty_violations(root)

            self.assertTrue(any("EA/portfolio tooling" in violation for violation in violations))

    def test_beats_chatgpt_positive_claim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(root, body="ArchLucid beats ChatGPT on every architecture review.\n")

            violations = G.bakeoff_15min_honesty_violations(root)

            self.assertTrue(any("beats frontier AI" in violation for violation in violations))

    def test_measured_kill_rate_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(root, body="Our measured deal-loss rate among manual ARB teams is published.\n")

            violations = G.bakeoff_15min_honesty_violations(root)

            self.assertTrue(any("M-20" in violation for violation in violations))

    def test_allowlist_marker_skips_violation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="LeanIX lost the bake-off bakeoff-15min-honesty: allow\n",
            )

            self.assertEqual(G.bakeoff_15min_honesty_violations(root), [])

    def test_quoted_table_positive_claim_still_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body='| Narrative | "ArchLucid beats ChatGPT on every architecture review" |\n',
            )

            violations = G.bakeoff_15min_honesty_violations(root)

            self.assertTrue(any("beats frontier AI" in violation for violation in violations))
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_procurement_packet(root)

            contract = root / G.CONTRACT_REL
            contract.parent.mkdir(parents=True, exist_ok=True)
            contract.write_text("Draft only.\n", encoding="utf-8")

            violations = G.bakeoff_15min_honesty_violations(root)

            self.assertTrue(any("missing required contract marker" in violation for violation in violations))


if __name__ == "__main__":
    unittest.main()
