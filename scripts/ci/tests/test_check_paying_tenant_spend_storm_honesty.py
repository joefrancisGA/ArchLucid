from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_paying_tenant_spend_storm_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_paying_tenant_spend_storm_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load paying-tenant spend-storm honesty guard.")

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
                "**TB-1570**",
                "compromised API key",
                "estimated",
                "M-294",
                "**TB-1571**",
                "LlmCompletionAccountingClient",
                "**TB-1287**",
            ]
        ),
        encoding="utf-8",
    )


def _write_pa_one_pager(root: Path) -> None:
    path = root / G.PA_ONE_PAGER_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md",
                "TB-1570",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestPayingTenantSpendStormHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.paying_tenant_spend_storm_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_pa_one_pager(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Tenant quotas gate Real LLM.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1570" in item or "compromised API key" in item for item in violations))

    def test_spend_storm_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Paying tenants cannot create an LLM spend storm under any configuration.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("spend storm" in item.lower() for item in violations))

    def test_stolen_key_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "A stolen API key cannot burn money after deployment.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("stolen" in item.lower() for item in violations))

    def test_invoice_reconcile_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "We have automated billing-dispute reconciliation for every tenant.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"))

            self.assertTrue(any("reconcil" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Too strong |\n| Estimated showback | "Product AI usage = Azure OpenAI bill" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
