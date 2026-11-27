"""Contract checks for the FND-163 policy, not an automated PR review guard."""

from __future__ import annotations

from pathlib import Path
import re
from unittest import TestCase

ROOT = Path(__file__).resolve().parents[3]
POLICY = ROOT / "docs/engineering/AI_ASSISTED_DEVELOPMENT_GOVERNANCE.md"
CURSOR = ROOT / ".cursor/rules/Test-Integrity-Regression-Preservation.mdc"
HEADING = "2.3. Mandatory test integrity and regression preservation"
ANCHOR = "23-mandatory-test-integrity-and-regression-preservation"
REGRESSION = "../assurance/AUTOMATIC_REGRESSION_POLICY.md#critical-defect-intake-and-ci"

EXPECTED_DISPOSITIONS = {
    "TI-01": "Accept scoped refactor",
    "TI-02": "Review erroneous test correction",
    "TI-03": "Review authorized contract change",
    "TI-04": "Review product correction",
    "TI-05": "Reject weakened assertion",
    "TI-06": "Reject rubber-stamped snapshot",
    "TI-07": "Reject unexplained skip",
    "TI-08": "Reject coverage-reducing mock",
    "TI-09": "Diagnose without changing the oracle",
    "TI-10": "Review independent alternative",
}


def github_fragment(heading: str) -> str:
    return re.sub(r"[^a-z0-9 -]", "", heading.lower()).replace(" ", "-")


def cursor_target(text: str) -> str:
    match = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
    if not match:
        raise ValueError("Cursor rule is missing frontmatter")
    always = re.findall(r"^alwaysApply:\s*(\S+)\s*$", match[1], re.M)
    if always != ["true"]:
        raise ValueError("Cursor rule must apply unconditionally")
    links = re.findall(r"\]\(([^)]+)\)", text[match.end():])
    if len(links) != 1:
        raise ValueError("Cursor rule must point to one canonical procedure")
    return links[0]


def case_outcomes(text: str) -> dict[str, str]:
    result = {}
    for line in text.splitlines():
        if not line.startswith("| TI-"):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != 4 or not all(cells) or cells[0] in result:
            raise ValueError("invalid or duplicate review example")
        case, _, outcome, _ = cells
        result[case] = outcome
    return result


def check_cases(text: str) -> None:
    if case_outcomes(text) != EXPECTED_DISPOSITIONS:
        raise ValueError("positive and negative review dispositions do not match the acceptance cases")


class TestIntegrityGovernanceTests(TestCase):
    def setUp(self) -> None:
        self.policy = POLICY.read_text(encoding="utf-8")
        self.section = self.policy.split(f"## {HEADING}\n", 1)[1].split("\n## 3.", 1)[0]

    def test_rule_is_active_and_links_to_the_canonical_heading(self) -> None:
        path, fragment = cursor_target(CURSOR.read_text(encoding="utf-8")).rsplit("#", 1)
        self.assertEqual((CURSOR.parent / path).resolve(), POLICY)
        self.assertEqual(fragment, ANCHOR)
        self.assertEqual(github_fragment(HEADING), ANCHOR)
        self.assertIn(f"## {HEADING}\n", self.policy)

    def test_common_workflow_and_agent_instructions_discover_the_procedure(self) -> None:
        self.assertIn(
            f"]({POLICY.relative_to(ROOT).as_posix()})",
            (ROOT / "AGENTS.md").read_text(encoding="utf-8"),
        )
        workflow = self.policy.split("## 2.1.", 1)[0]
        self.assertIn(f"](#{ANCHOR})", workflow)
        for client in ("ChatGPT", "Codex", "Cursor", "delegated agents"):
            self.assertIn(client, self.section)

    def test_covers_material_changes_and_all_four_mismatch_paths(self) -> None:
        for term in ("assertions", "expected values", "snapshots", "golden files", "tolerances", "mocks",
                     "fixture substitutions", "negative controls", "quarantines", "filters", "discovery", "exclusions"):
            with self.subTest(term=term):
                self.assertIn(term, self.section)
        for cause in ("Product defect", "Erroneous test", "Authorized contract evolution", "Environment failure or flake"):
            with self.subTest(cause=cause):
                self.assertIn(f"| {cause} |", self.section)

    def test_verification_distinguishes_replay_alternatives_and_unverified_results(self) -> None:
        for term in ("same regression", "defect-specific reason", "structural check", "reference comparison",
                     "property test", "executed counts", "infrastructure-only", "zero-test", "unverified"):
            self.assertIn(term, self.section)
        path, fragment = REGRESSION.rsplit("#", 1)
        contents = (POLICY.parent / path).resolve().read_text(encoding="utf-8")
        self.assertIn(f"]({REGRESSION})", self.section)
        self.assertIn(fragment, {github_fragment(line[3:]) for line in contents.splitlines() if line.startswith("## ")})

    def test_positive_and_negative_examples_match_acceptance(self) -> None:
        check_cases(self.section)

    def test_weakened_example_does_not_validate(self) -> None:
        drifted = self.section.replace("Reject weakened assertion", "Accept scoped refactor")
        with self.assertRaisesRegex(ValueError, "review dispositions"):
            check_cases(drifted)

    def test_disabled_cursor_rule_does_not_validate(self) -> None:
        drifted = CURSOR.read_text(encoding="utf-8").replace("alwaysApply: true", "alwaysApply: false")
        with self.assertRaisesRegex(ValueError, "unconditionally"):
            cursor_target(drifted)

    def test_review_standard_does_not_claim_the_followup_guard(self) -> None:
        self.assertIn("does not add automated diff enforcement (FND-165)", self.section)
        self.assertIn("traceability work (FND-171)", self.section)
