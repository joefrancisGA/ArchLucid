from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_minimum_pilot_trust_packet_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_minimum_pilot_trust_packet_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load minimum pilot trust packet honesty guard.")

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
                "**TB-1112**",
                "**TB-1113**",
                "G-REAL-05",
                "G-ASSURANCE-02",
                "Include (minimum Stage 0 bar)",
                "Drop / defer",
                "Too-strong vs safe",
                "M-190",
                "M-191",
            ]
        ),
        encoding="utf-8",
    )


def _write_buyer_packet(root: Path) -> None:
    path = root / G.BUYER_PACKET_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_CONTRACT.md",
                "TB-1112",
                "minimum-pilot-trust-packet-m-191",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestMinimumPilotTrustPacketHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.minimum_pilot_trust_packet_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_buyer_packet(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Stage 0 trust bar.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1112" in item or "TB-1113" in item for item in violations))

    def test_cpa_required_as_pilot_trust_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Pilot trust requires a CPA-issued SOC 2 report before any paid pilot.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("cpa" in item.lower() or "stage 0" in item.lower() for item in violations))

    def test_self_assessment_equals_certified_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Trust Center / SOC self-assessment = SOC 2 certified for buyers.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("self-attested" in item.lower() or "soc 2 certified" in item.lower() for item in violations))

    def test_soc2_ready_hedge_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "ArchLucid is SOC 2 ready for procurement this quarter.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"))

            self.assertTrue(any("hedge" in item.lower() or "soc 2" in item.lower() for item in violations))

    def test_pilot_trust_without_citation_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                "Our pilot trust packet is complete for Stage 0 selling.\n",
            )

            violations = G.scan_pilot_trust_citations(
                root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md")
            )

            self.assertTrue(any("cite" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Too strong |\n| Six-element Real SEND | "Pilot trust requires a CPA-issued SOC 2 report" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
