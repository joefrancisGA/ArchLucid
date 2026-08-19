import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "ci" / "check_assessment_backlog_hygiene.py"
_spec = importlib.util.spec_from_file_location("check_assessment_backlog_hygiene", _SCRIPT)
assert _spec and _spec.loader
_mod = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = _mod
_spec.loader.exec_module(_mod)


class CheckAssessmentBacklogHygieneTests(unittest.TestCase):
    def test_implemented_number_without_marker_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            latest = root / "docs" / "assessments" / "LATEST.md"
            latest.parent.mkdir(parents=True)
            latest.write_text(
                """## 9. Top Improvement Opportunities

### 4. Production Terraform Root Composition for OpenAI and AI Search

- **Status:** Fully actionable now.

```text
Compose Azure OpenAI into infra/terraform/prod.
```
""",
                encoding="utf-8",
            )

            violations = _mod.assessment_backlog_hygiene_violations(root)

            self.assertTrue(any("improvement #4" in violation for violation in violations))

    def test_deferred_prompt_without_marker_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            latest = root / "docs" / "assessments" / "LATEST.md"
            latest.parent.mkdir(parents=True)
            latest.write_text(
                """## 9. Top Improvement Opportunities

### 99. Example

- **Status:** Fully actionable now.

```text
Kick off SOC 2 CPA attestation this sprint.
```
""",
                encoding="utf-8",
            )

            violations = _mod.assessment_backlog_hygiene_violations(root)

            self.assertTrue(any("SOC 2 CPA attestation" in violation for violation in violations))

    def test_implemented_marker_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            latest = root / "docs" / "assessments" / "LATEST.md"
            latest.parent.mkdir(parents=True)
            latest.write_text(
                """## 9. Top Improvement Opportunities

### 4. Production Terraform Root Composition for OpenAI and AI Search

- **Status:** **Implemented (2026-05-30).** Done.
""",
                encoding="utf-8",
            )

            self.assertEqual(_mod.assessment_backlog_hygiene_violations(root), [])

    def test_mcp_constraint_negation_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            latest = root / "docs" / "assessments" / "LATEST.md"
            latest.parent.mkdir(parents=True)
            latest.write_text(
                """## 9. Top Improvement Opportunities

### 99. Example deferred-scope constraint text

- **Status:** Fully actionable now.

```text
Constraints: no MCP/marketplace scope; do not widen public HTTP contracts.
```
""",
                encoding="utf-8",
            )

            self.assertEqual(_mod.assessment_backlog_hygiene_violations(root), [])


if __name__ == "__main__":
    unittest.main()
