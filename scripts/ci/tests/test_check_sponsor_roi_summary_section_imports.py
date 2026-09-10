import importlib.util
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPT = REPO_ROOT / "scripts" / "ci" / "check_sponsor_roi_summary_section_imports.py"
_SPEC = importlib.util.spec_from_file_location("check_sponsor_roi_summary_section_imports", _SCRIPT)
_MODULE = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(_MODULE)

_TARGET = (
    REPO_ROOT
    / "archlucid-ui/src/app/(operator)/architecture/sponsor-dashboard/_sections/"
    "SponsorRoiSummarySection.tsx"
)


class CheckSponsorRoiSummarySectionImportsTests(unittest.TestCase):
    def test_passes_on_current_component(self) -> None:
        self.assertEqual(_MODULE.main([]), 0)

    def test_fails_when_card_import_missing(self) -> None:
        original = _TARGET.read_text(encoding="utf-8")
        broken = original.replace(
            'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";',
            "",
        )

        try:
            _TARGET.write_text(broken, encoding="utf-8")
            self.assertEqual(_MODULE.main([]), 1)
        finally:
            _TARGET.write_text(original, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
