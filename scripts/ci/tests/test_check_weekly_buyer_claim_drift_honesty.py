from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_weekly_buyer_claim_drift_honesty.py"
    spec = importlib.util.spec_from_file_location(
        "_check_weekly_buyer_claim_drift_honesty",
        script,
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load weekly buyer-claim drift honesty guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_inventory(root: Path) -> None:
    path = root / G.INVENTORY_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("TB-1463 C1 C2 C3\n", encoding="utf-8")


def _write_clean_surfaces(root: Path) -> None:
    guide = root / "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"
    guide.parent.mkdir(parents=True, exist_ok=True)
    guide.write_text(
        "Native connectors (Jira) V1 GA with caveats. G-REAL-05 deferred CPA.\n",
        encoding="utf-8",
    )

    brief = root / "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"
    brief.parent.mkdir(parents=True, exist_ok=True)
    brief.write_text("Do not use two weeks to two hours without M-245.\n", encoding="utf-8")

    see_it = root / "archlucid-ui/src/lib/see-it-page-copy.ts"
    see_it.parent.mkdir(parents=True, exist_ok=True)
    see_it.write_text(
        "\n".join(
            [
                'export const SEE_IT_PAGE_TITLE = "See a finalized sample review";',
                'export const SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL = "Download sample overview (PDF)";',
            ]
        ),
        encoding="utf-8",
    )


class TestWeeklyBuyerClaimDriftHonesty(unittest.TestCase):
    def test_repo_passes(self):
        self.assertEqual(G.weekly_buyer_claim_drift_honesty_errors(_REPO), [])

    def test_stale_connector_row_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_inventory(root)
            _write_clean_surfaces(root)

            guide = root / "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"
            guide.write_text("V1.1 connectors (Jira, ServiceNow)\n", encoding="utf-8")

            errors = G.weekly_buyer_claim_drift_honesty_errors(root)

            self.assertTrue(any("C1" in item for item in errors))

    def test_unguarded_two_weeks_two_hours_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_inventory(root)
            _write_clean_surfaces(root)

            brief = root / "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"
            brief.write_text("Reviews that took two weeks now take two hours.\n", encoding="utf-8")

            errors = G.weekly_buyer_claim_drift_honesty_errors(root)

            self.assertTrue(any("C3" in item for item in errors))

    def test_see_it_title_regression_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_inventory(root)
            _write_clean_surfaces(root)

            see_it = root / "archlucid-ui/src/lib/see-it-page-copy.ts"
            see_it.write_text('export const SEE_IT_PAGE_TITLE = "Live demo";\n', encoding="utf-8")

            errors = G.weekly_buyer_claim_drift_honesty_errors(root)

            self.assertTrue(any("C4" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
