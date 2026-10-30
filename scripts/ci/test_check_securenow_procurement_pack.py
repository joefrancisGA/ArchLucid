"""Unit tests for scripts/ci/check_securenow_procurement_pack.py."""
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_procurement_pack import validate


def _minimal_wave2(root: Path) -> None:
    sn = root / "docs/securenow"
    sn.mkdir(parents=True, exist_ok=True)
    pilot = sn / "CONTROLLED_PILOT_OFFER.md"
    if not pilot.is_file():
        pilot.write_text("pilot", encoding="utf-8")
    index = sn / "PROCUREMENT_PACK_INDEX.md"
    if not index.is_file():
        index.write_text("index", encoding="utf-8")

    (sn / "DATA_PROCESSING_SCHEDULE.md").write_text(
        "> **Scope:** test.\n\n"
        "TO BE NEGOTIATED. Platform template 90 days. ADR 0104.\n"
        "[pilot](CONTROLLED_PILOT_OFFER.md)\n",
        encoding="utf-8",
    )
    (sn / "SUBPROCESSORS_DELTA.md").write_text(
        "> **Scope:** test.\n\n"
        "See SUBPROCESSORS.md. Not offered for optional engines.\n"
        "[pilot](CONTROLLED_PILOT_OFFER.md)\n",
        encoding="utf-8",
    )
    crosswalk_rows = "".join(
        f"| T{i} | [pilot](CONTROLLED_PILOT_OFFER.md) | diff | paste |\n" for i in range(24)
    )
    (sn / "QUESTIONNAIRE_CROSSWALK.md").write_text(
        "> **Scope:** Not a completed SIG or CAIQ.\n\n"
        "| Theme | Where the shared answer lives | SecureNow difference | Paste this |\n"
        "| --- | --- | --- | --- |\n"
        + crosswalk_rows,
        encoding="utf-8",
    )
    (sn / "QUOTE_COVER.md").write_text(
        "> **Scope:** test.\n\n"
        "NOT AN APPROVED CUSTOMER OFFER. SN-EVAL. HOLD_NO_PUBLICATION.\n",
        encoding="utf-8",
    )


def _minimal_core_pack(root: Path, *, index_body: str, one_body: str, overlay_body: str) -> None:
    sn = root / "docs/securenow"
    sn.mkdir(parents=True, exist_ok=True)
    (sn / "PROCUREMENT_PACK_INDEX.md").write_text(index_body, encoding="utf-8")
    (sn / "BUYER_SECURITY_ONE_PAGER.md").write_text(one_body, encoding="utf-8")
    (sn / "PROCUREMENT_RESPONSE_OVERLAY.md").write_text(overlay_body, encoding="utf-8")
    _minimal_wave2(root)


class SecureNowProcurementPackTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_broken_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
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
            _minimal_core_pack(root, index_body=index, one_body=one, overlay_body=overlay)
            errors = validate(root)
            self.assertTrue(any("broken link" in e for e in errors))

    def test_bare_soc2_certified_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
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
            _minimal_core_pack(root, index_body=base_index, one_body=one, overlay_body=overlay_bad)
            errors = validate(root)
            self.assertTrue(any("SOC 2 certified" in e for e in errors))

    def test_negated_soc2_certified_passes_phrase_check(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
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
            _minimal_core_pack(root, index_body=index, one_body=one, overlay_body=overlay)
            self.assertEqual([], validate(root))

    def test_quote_cover_dollar_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
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
            _minimal_core_pack(root, index_body=index, one_body=one, overlay_body=overlay)
            cover = root / "docs/securenow/QUOTE_COVER.md"
            cover.write_text(cover.read_text(encoding="utf-8") + " price $8000\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("quote_cover" in e for e in errors))

    def test_crosswalk_too_short_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
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
            _minimal_core_pack(root, index_body=index, one_body=one, overlay_body=overlay)
            short_rows = "".join(
                f"| T{i} | [pilot](CONTROLLED_PILOT_OFFER.md) | d | p |\n" for i in range(10)
            )
            (root / "docs/securenow/QUESTIONNAIRE_CROSSWALK.md").write_text(
                "> **Scope:** Not a completed SIG or CAIQ.\n\n"
                "| Theme | Where | Diff | Paste |\n| --- | --- | --- | --- |\n"
                + short_rows,
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("crosswalk" in e and "24" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
