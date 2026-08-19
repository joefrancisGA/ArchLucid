from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_assessment_scope_regression.py"
    spec = importlib.util.spec_from_file_location("_check_assessment_scope_regression", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load assessment scope regression guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_latest(root: Path, body: str) -> None:
    target = root / "docs" / "assessments" / "LATEST.md"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body, encoding="utf-8")


class TestAssessmentScopeRegression(unittest.TestCase):
    def test_safe_current_improvement_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_latest(
                root,
                """# Assessment

## 9. Top Improvement Opportunities

### 1. First-Screen Proof Status Summary

## 11. Pending Questions for Later

### AI Evidence Thresholds

- What minimum real-mode cohort result should be treated as acceptable?
""",
            )

            self.assertEqual(G.assessment_scope_violations(root), [])

    def test_v1_1_item_as_improvement_heading_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_latest(
                root,
                """# Assessment

## 9. Top Improvement Opportunities

### 23. Real Pilot Proof Packet Cohort

## 11. Pending Questions for Later
""",
            )

            violations = G.assessment_scope_violations(root)

            self.assertTrue(any("real pilot proof packet cohort" in violation for violation in violations))

    def test_v1_1_item_as_deferred_heading_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_latest(
                root,
                """# Assessment

## 9. Top Improvement Opportunities

### 25. DEFERRED Live Commerce Un-Hold

## 11. Pending Questions for Later
""",
            )

            self.assertEqual(G.assessment_scope_violations(root), [])

    def test_v1_1_item_as_pending_question_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_latest(
                root,
                """# Assessment

## 9. Top Improvement Opportunities

### 1. Safe Improvement

## 11. Pending Questions for Later

- Which channel should Market-Facing Demo Asset Production optimize first?
""",
            )

            violations = G.assessment_scope_violations(root)

            self.assertTrue(any("market-facing demo asset production" in violation for violation in violations))

    def test_backlog_only_safe_reference_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_latest(
                root,
                """# Assessment

## 9. Top Improvement Opportunities

### 23. V1/V1.1 Assessment Scope Regression Guard

- Do not batch V1.1 owner-output GTM work unless the corresponding V1.1 backlog item is explicitly picked up.

## 11. Pending Questions for Later
""",
            )

            self.assertEqual(G.assessment_scope_violations(root), [])


if __name__ == "__main__":
    unittest.main()
