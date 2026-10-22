from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_security_review_ready_without_musts_honesty.py"
    spec = importlib.util.spec_from_file_location(
        "_check_security_review_ready_without_musts_honesty",
        script,
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load security review readiness honesty guard.")

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
                "**TB-1120**",
                "**TB-1121**",
                "M-192",
                "M-193",
                "Ship order",
                "Too strong vs safe",
                "CI anchors for **TB-1121**",
                "M-151",
                "M-118",
                "M-114",
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
                "FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_CONTRACT.md",
                "TB-1120",
                "first-security-review-ship-order-m-193",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestSecurityReviewReadyWithoutMustsHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.security_review_ready_without_musts_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_buyer_packet(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Security review overview.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1120" in item or "TB-1121" in item for item in violations))

    def test_ready_with_only_m114_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "We are ready for first security review with only M-114 isolation.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("m-114" in item.lower() or "isolation" in item.lower() for item in violations))

    def test_m171_as_first_review_gate_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "First security review ready requires M-171 process vs provider idempotency.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("m-171" in item.lower() for item in violations))

    def test_security_review_ready_without_citation_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "ArchLucid is ready for the first buyer security review today.\n",
            )

            violations = G.scan_security_review_citations(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
            )

            self.assertTrue(any("tb-1120" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
