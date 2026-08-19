"""Tests for the proof-language superlative guard."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCANNER = REPO_ROOT / "scripts" / "ci" / "check_proof_language_superlatives.py"

sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))

from check_proof_language_superlatives import scan_text  # noqa: E402

_TERMS = ["best-in-class", "always beats", "guaranteed savings"]
_CAVEATS = ["do not", "not ", "without", "illustrative", "estimate"]


class ProofLanguageSuperlativeUnitTests(unittest.TestCase):
    def test_flags_bare_superlative(self) -> None:
        violations = scan_text(
            "ArchLucid is best-in-class for governed review.",
            source_label="fixture.md",
            superlative_terms=_TERMS,
            caveat_markers=_CAVEATS,
        )
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0].term, "best-in-class")

    def test_caveated_line_passes(self) -> None:
        violations = scan_text(
            "Do not claim ArchLucid always beats frontier AI on speed.",
            source_label="fixture.md",
            superlative_terms=_TERMS,
            caveat_markers=_CAVEATS,
        )
        self.assertEqual(violations, [])

    def test_markdown_bolded_caveat_passes(self) -> None:
        violations = scan_text(
            "Do **not** claim ArchLucid always beats frontier AI on cost.",
            source_label="fixture.md",
            superlative_terms=_TERMS,
            caveat_markers=_CAVEATS,
        )
        self.assertEqual(violations, [])

    def test_source_labeled_estimate_passes(self) -> None:
        violations = scan_text(
            'Do not promise "guaranteed savings" — use a source-labeled estimate instead.',
            source_label="fixture.md",
            superlative_terms=_TERMS,
            caveat_markers=_CAVEATS,
        )
        self.assertEqual(violations, [])


class ProofLanguageSuperlativeScopeTests(unittest.TestCase):
    def test_repo_scope_is_clean(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCANNER)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
