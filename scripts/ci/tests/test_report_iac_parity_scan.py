import importlib.util
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "ci" / "report_iac_parity_scan.py"
_spec = importlib.util.spec_from_file_location("report_iac_parity_scan", _SCRIPT)
assert _spec and _spec.loader
_mod = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = _mod
_spec.loader.exec_module(_mod)
build_report = _mod.build_report
repo_root = _mod.repo_root
_probe_configuration = _mod._probe_configuration
_resolve_terraform_root = _mod._resolve_terraform_root


class ReportIacParityScanTests(unittest.TestCase):
    def test_build_report_prefers_prod_root_in_row_metadata(self) -> None:
        report = build_report(repo_root())
        rows = report["rows"]
        openai = next(row for row in rows if row["service"] == "Azure OpenAI")
        # Canonical hosted scaffold is authored under deploy/ and synced to infra/terraform/prod.
        self.assertEqual(openai["terraformRootsChecked"][0], "deploy/hosted-prod-terraform")
        self.assertIn("terraformSupported", openai)

    def test_prod_root_signals_openai_and_search_when_present(self) -> None:
        root = repo_root()
        _, openai_supported, openai_signals = _resolve_terraform_root(
            root,
            ("infra/terraform/prod", "infra/terraform-openai"),
            ("azurerm_cognitive_account", "azure-openai"),
        )
        _, search_supported, search_signals = _resolve_terraform_root(
            root,
            ("infra/terraform/prod", "infra/terraform-search"),
            ("azurerm_search_service", "azure-search"),
        )
        self.assertTrue(openai_supported, msg=f"expected OpenAI signals, got {openai_signals}")
        self.assertTrue(search_supported, msg=f"expected Search signals, got {search_signals}")

    def test_v1_optional_services_not_in_parity_map(self) -> None:
        report = build_report(repo_root())
        labels = {row["service"] for row in report["rows"]}
        self.assertNotIn("Redis (hot path)", labels)
        self.assertNotIn("Cosmos DB", labels)
        self.assertNotIn("Service Bus", labels)

    def test_archlucid_sql_key_is_probed(self) -> None:
        config_text = (repo_root() / "ArchLucid.Api" / "appsettings.json").read_text(encoding="utf-8")
        probe = _probe_configuration(config_text, "ConnectionStrings:ArchLucid")
        self.assertTrue(probe.configured)


if __name__ == "__main__":
    unittest.main()
