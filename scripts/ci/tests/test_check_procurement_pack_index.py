from __future__ import annotations

import importlib.util
import tempfile
import unittest
from datetime import date
from pathlib import Path


def _load_pack_index_guard():
    root = Path(__file__).resolve().parents[3]
    path = root / "scripts" / "ci" / "check_procurement_pack_index.py"
    spec = importlib.util.spec_from_file_location("procurement_pack_index_guard", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    spec.loader.exec_module(module)
    return module


_MIN_INDEX_MARKDOWN = """## Procurement artifact status map (buyer-safe classification)

| Procurement Artifact | Status | Source File | Notes |
|---|---|---|---|
| X | Deferred | [V1](../library/V1_DEFERRED.md) | Maps to [`V1_DEFERRED`](../library/V1_DEFERRED.md) section 6c. |

| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |
|---|---|---|---|---|
| Row1 | Self-asserted | {reviewed} | [scope](../library/V1_SCOPE.md) | Buyer-safe claim text. |
"""


class TestProcurementPackIndexGuard(unittest.TestCase):
    def test_self_asserted_stale_row_fails(self) -> None:
        mod = _load_pack_index_guard()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            lib = root / "docs" / "library"
            gtm.mkdir(parents=True)
            lib.mkdir(parents=True)
            (lib / "V1_DEFERRED.md").write_text("# stub\n", encoding="utf-8")
            (lib / "V1_SCOPE.md").write_text("# stub\n", encoding="utf-8")
            index_md = gtm / "PROCUREMENT_PACK_INDEX.md"
            index_md.write_text(
                _MIN_INDEX_MARKDOWN.format(reviewed="2020-01-01"),
                encoding="utf-8",
            )

            errors, _warns = mod.validate_procurement_pack_index(
                root,
                index_md,
                date(2026, 5, 8),
                index_md.read_text(encoding="utf-8"),
            )

        self.assertTrue(any("stale" in e.lower() for e in errors))

    def test_broken_canonical_link_fails(self) -> None:
        mod = _load_pack_index_guard()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            lib = root / "docs" / "library"
            gtm.mkdir(parents=True)
            lib.mkdir(parents=True)
            (lib / "V1_DEFERRED.md").write_text("# stub\n", encoding="utf-8")
            index_md = gtm / "PROCUREMENT_PACK_INDEX.md"
            index_md.write_text(
                _MIN_INDEX_MARKDOWN.format(reviewed="2099-01-01").replace(
                    "[scope](../library/V1_SCOPE.md)",
                    "[missing](../library/NO_SUCH_FILE.md)",
                ),
                encoding="utf-8",
            )

            errors, _warns = mod.validate_procurement_pack_index(
                root,
                index_md,
                date(2026, 5, 8),
                index_md.read_text(encoding="utf-8"),
            )

        self.assertTrue(any("missing file" in e for e in errors))

    def test_placeholder_tbd_in_index_fails(self) -> None:
        mod = _load_pack_index_guard()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            lib = root / "docs" / "library"
            gtm.mkdir(parents=True)
            lib.mkdir(parents=True)
            (lib / "V1_DEFERRED.md").write_text("# stub\n", encoding="utf-8")
            (lib / "V1_SCOPE.md").write_text("# stub\n", encoding="utf-8")
            index_md = gtm / "PROCUREMENT_PACK_INDEX.md"
            index_md.write_text(
                "TBD in header.\n\n" + _MIN_INDEX_MARKDOWN.format(reviewed="2099-01-01"),
                encoding="utf-8",
            )

            errors, _warns = mod.validate_procurement_pack_index(
                root,
                index_md,
                date(2026, 5, 8),
                index_md.read_text(encoding="utf-8"),
            )

        self.assertTrue(any("placeholder" in e.lower() or "TBD" in e for e in errors))

    def test_forbidden_soc2_issued_wording_fails(self) -> None:
        mod = _load_pack_index_guard()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            lib = root / "docs" / "library"
            gtm.mkdir(parents=True)
            lib.mkdir(parents=True)
            (lib / "V1_DEFERRED.md").write_text("# stub\n", encoding="utf-8")
            (lib / "V1_SCOPE.md").write_text("# stub\n", encoding="utf-8")
            index_md = gtm / "PROCUREMENT_PACK_INDEX.md"
            poison = (
                "Marketing claims our SOC 2 Type II audit report is available under NDA.\n\n"
                + _MIN_INDEX_MARKDOWN.format(reviewed="2099-01-01")
            )
            index_md.write_text(poison, encoding="utf-8")

            errors, _warns = mod.validate_procurement_pack_index(
                root,
                index_md,
                date(2026, 5, 8),
                index_md.read_text(encoding="utf-8"),
            )

        self.assertTrue(
            any("SOC 2 Type II CPA report" in e or "implies a SOC 2 Type II" in e for e in errors),
        )

    def test_forbidden_iso_cert_wording_fails(self) -> None:
        mod = _load_pack_index_guard()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            lib = root / "docs" / "library"
            gtm.mkdir(parents=True)
            lib.mkdir(parents=True)
            (lib / "V1_DEFERRED.md").write_text("# stub\n", encoding="utf-8")
            (lib / "V1_SCOPE.md").write_text("# stub\n", encoding="utf-8")
            index_md = gtm / "PROCUREMENT_PACK_INDEX.md"
            poison = (
                "We have an active ISO 27001 certificate for all production systems.\n\n"
                + _MIN_INDEX_MARKDOWN.format(reviewed="2099-01-01")
            )
            index_md.write_text(poison, encoding="utf-8")

            errors, _warns = mod.validate_procurement_pack_index(
                root,
                index_md,
                date(2026, 5, 8),
                index_md.read_text(encoding="utf-8"),
            )

        self.assertTrue(any("ISO 27001" in e and "certification" in e for e in errors))

    def test_deferred_v1_1_row_not_subject_to_freshness_gate(self) -> None:
        """Deferred planning rows may carry historical review dates without failing the 90-day gate."""
        mod = _load_pack_index_guard()

        deferred_body = """## Procurement artifact status map (buyer-safe classification)

| Procurement Artifact | Status | Source File | Notes |
|---|---|---|---|
| X | Deferred | [V1](../library/V1_DEFERRED.md) | Maps to [`V1_DEFERRED`](../library/V1_DEFERRED.md) section 6c. |

| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |
|---|---|---|---|---|
| Roadmap | Deferred V1.1 | 2019-01-01 | [scope](../library/V1_SCOPE.md) | Historical review date only. |
"""

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gtm = root / "docs" / "go-to-market"
            lib = root / "docs" / "library"
            gtm.mkdir(parents=True)
            lib.mkdir(parents=True)
            (lib / "V1_DEFERRED.md").write_text("# stub\n", encoding="utf-8")
            (lib / "V1_SCOPE.md").write_text("# stub\n", encoding="utf-8")
            index_md = gtm / "PROCUREMENT_PACK_INDEX.md"
            index_md.write_text(deferred_body, encoding="utf-8")

            errors, _warns = mod.validate_procurement_pack_index(
                root,
                index_md,
                date(2026, 5, 8),
                index_md.read_text(encoding="utf-8"),
            )

        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
