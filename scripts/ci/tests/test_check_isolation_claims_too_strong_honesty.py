from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_isolation_claims_too_strong_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_isolation_claims_too_strong_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load isolation claims too-strong honesty guard.")

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
                "**TB-1122**",
                "**TB-1123**",
                "M-194",
                "M-195",
                "Too strong vs shipped",
                "CI anchors for **TB-1123**",
                "ADR 0037",
                "INV-001",
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
                "ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md",
                "TB-1122",
                "isolation-claims-vs-inv001-adr0037-m-195",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestIsolationClaimsTooStrongHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.isolation_claims_too_strong_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_buyer_packet(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Isolation overview.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1122" in item or "TB-1123" in item for item in violations))

    def test_rls_as_live_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "SQL RLS isolates tenants in production for every paying customer.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("rls" in item.lower() for item in violations))

    def test_rls_for_tenant_isolation_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "We use SQL RLS for tenant isolation in production.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("rls" in item.lower() for item in violations))

    def test_sot_id_name_drop_does_not_exempt_dishonest_claim(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Per TB-1122 and ADR 0037, the workspace is the tenant security boundary.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("workspace" in item.lower() or "boundary" in item.lower() for item in violations))

    def test_workspace_boundary_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "The workspace is the tenant security boundary for each paying client.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("workspace" in item.lower() or "boundary" in item.lower() for item in violations))

    def test_crypto_proof_search_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "We ship crypto-proof retrieval via a per-tenant Search index.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"))

            self.assertTrue(any("search" in item.lower() or "crypto" in item.lower() for item in violations))

    def test_netarch_alone_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                "NetArchTest alone proves tenant isolation across the product.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertTrue(any("netarch" in item.lower() or "architecture" in item.lower() for item in violations))

    def test_g3_without_citation_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
                "G3 PASS confirms fully proven isolation for every buyer review.\n",
            )

            violations = G.scan_g3_citations(root, Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"))

            self.assertTrue(any("cite" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_buyer_packet(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Too strong | Safe |\n| "SQL RLS isolates tenants" | database-per-tenant catalogs |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
