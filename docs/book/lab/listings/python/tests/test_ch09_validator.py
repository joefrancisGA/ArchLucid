"""Chapter 9: the validator against the chapter's own pack and printed summaries."""

from __future__ import annotations

import unittest

import support
from ch09_validator import expand_range, validate

CHAPTER = "chapters/09-where-llms-help.md"
OPENING_SUMMARY = "Our investigation found that attackers could compromise"
GROUNDED_SUMMARY = "Six access paths lead from people and pipelines"


def pack() -> dict:
    return support.json_block_starting(CHAPTER, "packId")


def opening_draft() -> dict:
    """The board summary from the opening story, as a draft with no citations."""
    quote = support.quote_after(CHAPTER, "Thirty seconds later")

    return support.draft_from_quote(quote)


class BookClaims(unittest.TestCase):
    def test_opening_summary_is_rejected_for_the_stated_reasons(self) -> None:
        problems = validate(opening_draft(), pack())

        self.assertIn("Sentence 1: no citation.", problems)
        self.assertTrue(any("has been exposed" in problem for problem in problems))
        self.assertTrue(any("'85%'" in problem for problem in problems))

    def test_grounded_summary_passes(self) -> None:
        quote = support.quote_after(CHAPTER, "The output:")

        self.assertTrue(quote.startswith(GROUNDED_SUMMARY))
        self.assertEqual(validate(support.draft_from_quote(quote), pack()), [])

    def test_structured_output_example_passes(self) -> None:
        draft = support.json_block_starting(CHAPTER, "status")

        self.assertEqual(validate(draft, pack()), [])

    def test_board_architect_and_auditor_versions_pass(self) -> None:
        for label in ("**Executive or board**", "**Security architect**", "**Auditor**"):
            with self.subTest(label):
                quote = support.quote_after(CHAPTER, label)

                self.assertEqual(validate(support.draft_from_quote(quote), pack()), [])

    def test_engineer_version_fails_only_on_its_uncited_advice(self) -> None:
        quote = support.quote_after(CHAPTER, "**Engineer on the payments team**")
        draft = support.draft_from_quote(quote)

        self.assertTrue(draft["sentences"][2]["text"].startswith("Before changing it"))
        self.assertEqual(validate(draft, pack()), ["Sentence 3: no citation."])

    def test_misstatement_passes_every_check(self) -> None:
        # Section 9.5: cited, named, and wrong. Only a support check or a human catches it.
        draft = {"sentences": [{"text": "The deployment identity owns the storage account.",
                                "cites": ["H5"]}]}

        self.assertEqual(validate(draft, pack()), [])


class Checks(unittest.TestCase):
    def check(self, text: str, cites: list[str], status: str = "answered") -> list[str]:
        return validate({"status": status, "sentences": [{"text": text, "cites": cites}]}, pack())

    def test_unknown_citation(self) -> None:
        self.assertEqual(self.check("Something about the pack.", ["H99"]),
                         ["Sentence 1: cites unknown ID H99."])

    def test_activity_wording(self) -> None:
        problems = self.check("The path was used last week.", ["P1"])

        self.assertEqual(len(problems), 1)
        self.assertIn("was used", problems[0])

    def test_invented_number(self) -> None:
        self.assertEqual(self.check("Fix it within 30 days.", ["C1"]),
                         ["Sentence 1: number '30' does not appear in the pack."])

    def test_path_count_is_allowed(self) -> None:
        self.assertEqual(self.check("There are 6 paths.", ["P1-P6"]), [])

    def test_invented_backticked_name(self) -> None:
        self.assertEqual(self.check("`kv-payments` is involved.", ["H5"]),
                         ["Sentence 1: name 'kv-payments' does not appear in the pack."])

    def test_provenance_fields_count_as_pack_text(self) -> None:
        self.assertEqual(self.check("The Data Protection Officer asserted it on 2026-09-14.", ["T1"]), [])

    def test_untrusted_text_never_counts_as_pack_text(self) -> None:
        with_untrusted = dict(pack(), untrustedText=[{"id": "U1", "value": "SEC-1142 kv-secret"}])
        draft = {"sentences": [{"text": "See kv-secret.", "cites": ["H1"]}]}

        self.assertEqual(validate(draft, with_untrusted),
                         ["Sentence 1: name 'kv-secret' does not appear in the pack."])

    def with_unmodeled_path(self) -> dict:
        """Chapter 5's optional lab step, as pack items: a path that rests on a role condition."""
        base = pack()
        path = {"id": "P7", "hops": ["H10"], "target": "Read customer data in custdata",
                "confidence": "Insufficient evidence", "gaps": ["G3"]}
        gap = {"id": "G3", "kind": "unmodeledControl",
               "claim": "A role-assignment condition on analyst-04's blob reader role was not evaluated."}

        return dict(base, paths=base["paths"] + [path], gaps=base["gaps"] + [gap])

    def test_citing_an_unmodeled_path_requires_its_gap(self) -> None:
        draft = {"sentences": [{"text": "Another path reaches customer data.", "cites": ["P7"]}]}

        self.assertEqual(validate(draft, self.with_unmodeled_path()), ["Draft cites P7 but not its gap G3."])

    def test_gap_cited_anywhere_in_the_draft_satisfies_the_check(self) -> None:
        draft = {"sentences": [
            {"text": "Another path reaches customer data.", "cites": ["P7"]},
            {"text": "Whether it holds depends on a condition that was not evaluated.", "cites": ["G3"]},
        ]}

        self.assertEqual(validate(draft, self.with_unmodeled_path()), [])

    def test_uncited_unmodeled_path_needs_no_gap(self) -> None:
        self.assertEqual(validate({"sentences": [{"text": "Six paths exist.", "cites": ["P1-P6"]}]},
                                  self.with_unmodeled_path()), [])

    def test_clean_exit(self) -> None:
        self.assertEqual(validate({"status": "insufficient_evidence", "sentences": []}, pack()), [])

    def test_exit_with_sentences_is_a_failure(self) -> None:
        problems = self.check("Six paths exist.", ["P1-P6"], status="insufficient_evidence")

        self.assertEqual(problems,
                         ["Draft sets status insufficient_evidence but still returns sentences."])


class ExpandRange(unittest.TestCase):
    def test_hyphen_range(self) -> None:
        self.assertEqual(expand_range("P1-P3"), ["P1", "P2", "P3"])

    def test_en_dash_range(self) -> None:
        self.assertEqual(expand_range("P1\u2013P3"), ["P1", "P2", "P3"])

    def test_short_range(self) -> None:
        self.assertEqual(expand_range("H5-7"), ["H5", "H6", "H7"])

    def test_single_id(self) -> None:
        self.assertEqual(expand_range("G1"), ["G1"])

    def test_mixed_prefixes_are_not_a_range(self) -> None:
        self.assertEqual(expand_range("P1-H3"), ["P1-H3"])


if __name__ == "__main__":
    unittest.main()
