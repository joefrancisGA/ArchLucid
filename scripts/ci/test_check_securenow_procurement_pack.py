"""Unit tests for scripts/ci/check_securenow_procurement_pack.py."""
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_procurement_pack import validate


class SecureNowProcurementPackTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_broken_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docs/securenow").mkdir(parents=True)
            index = (
                "> **Scope:** test.\n\n"
                "## Procurement artifact status map (buyer-safe classification)\n\n"
                "| Procurement Artifact | Status | Source File | Notes |\n"
                "| --- | --- | --- | --- |\n"
                "| Example | Template | [missing.md](missing.md) | ok |\n\n"
                "| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| Row | Self-asserted | 2026-10-29 | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | ok |\n"
            )
            one = (
                "> **Scope:** test.\n\n"
                "NOT AN APPROVED CUSTOMER OFFER. NO_GO outside NOT VERIFIED SOC 2.\n"
            )
            overlay = (
                "> **Scope:** test.\n\n"
                "| Theme | Question | Answer | Source |\n"
                "| --- | --- | --- | --- |\n"
                + "".join(
                    f"| T{i} | Q | A | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) |\n"
                    for i in range(18)
                )
            )
            (root / "docs/securenow/PROCUREMENT_PACK_INDEX.md").write_text(index, encoding="utf-8")
            (root / "docs/securenow/BUYER_SECURITY_ONE_PAGER.md").write_text(one, encoding="utf-8")
            (root / "docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md").write_text(overlay, encoding="utf-8")
            (root / "docs/securenow/CONTROLLED_PILOT_OFFER.md").write_text("pilot", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("broken link" in e for e in errors))

    def test_bare_soc2_certified_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docs/securenow").mkdir(parents=True)
            base_index = (
                "> **Scope:** test.\n\n"
                "## Procurement artifact status map (buyer-safe classification)\n\n"
                "| Procurement Artifact | Status | Source File | Notes |\n"
                "| --- | --- | --- | --- |\n"
                "| Example | Template | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | ok |\n\n"
                "| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| Row | Self-asserted | 2026-10-29 | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | ok |\n"
            )
            one = (
                "> **Scope:** test.\n\n"
                "NOT AN APPROVED CUSTOMER OFFER. NO_GO outside NOT VERIFIED SOC 2.\n"
            )
            overlay_bad = (
                "> **Scope:** test.\n\n"
                "| Theme | Question | Answer | Source |\n"
                "| --- | --- | --- | --- |\n"
                + "".join(
                    f"| T{i} | Q | A | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) |\n"
                    for i in range(17)
                )
                + "| SOC | Q | We are SOC 2 certified today. | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) |\n"
            )
            (root / "docs/securenow/PROCUREMENT_PACK_INDEX.md").write_text(base_index, encoding="utf-8")
            (root / "docs/securenow/BUYER_SECURITY_ONE_PAGER.md").write_text(one, encoding="utf-8")
            (root / "docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md").write_text(overlay_bad, encoding="utf-8")
            (root / "docs/securenow/CONTROLLED_PILOT_OFFER.md").write_text("pilot", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("SOC 2 certified" in e for e in errors))

    def test_negated_soc2_certified_passes_phrase_check(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docs/securenow").mkdir(parents=True)
            index = (
                "> **Scope:** test.\n\n"
                "## Procurement artifact status map (buyer-safe classification)\n\n"
                "| Procurement Artifact | Status | Source File | Notes |\n"
                "| --- | --- | --- | --- |\n"
                "| Example | Template | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | ok |\n\n"
                "| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| Row | Self-asserted | 2026-10-29 | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | ok |\n"
            )
            one = (
                "> **Scope:** test.\n\n"
                "NOT AN APPROVED CUSTOMER OFFER. NO_GO outside NOT VERIFIED SOC 2.\n"
                "Do not say SOC 2 certified in buyer email.\n"
            )
            overlay = (
                "> **Scope:** test.\n\n"
                "| Theme | Question | Answer | Source |\n"
                "| --- | --- | --- | --- |\n"
                + "".join(
                    f"| T{i} | Q | A | [PROCUREMENT_PACK_INDEX.md](PROCUREMENT_PACK_INDEX.md) |\n"
                    for i in range(18)
                )
            )
            (root / "docs/securenow/PROCUREMENT_PACK_INDEX.md").write_text(index, encoding="utf-8")
            (root / "docs/securenow/BUYER_SECURITY_ONE_PAGER.md").write_text(one, encoding="utf-8")
            (root / "docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md").write_text(overlay, encoding="utf-8")
            (root / "docs/securenow/CONTROLLED_PILOT_OFFER.md").write_text("pilot", encoding="utf-8")
            self.assertEqual([], validate(root))


if __name__ == "__main__":
    unittest.main()
