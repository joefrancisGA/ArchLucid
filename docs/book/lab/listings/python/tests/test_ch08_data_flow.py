"""Chapter 8: activity wording needs a cited observed-activity item and its window."""

from __future__ import annotations

import unittest

import support
from ch08_data_flow import activity_problems

ITEMS = {
    "A1": {"id": "A1", "category": "observed activity",
           "window": {"start": "2026-10-01", "end": "2026-10-07"}},
    "A2": {"id": "A2", "category": "observed activity", "window": {}},
    "H9": {"id": "H9", "category": "observed fact"},
}


def problems(text: str, cites: list[str]) -> list[str]:
    return activity_problems(1, {"text": text, "cites": cites}, ITEMS)


class ActivityProblems(unittest.TestCase):
    def test_present_tense_read_is_flagged_deliberately(self) -> None:
        self.assertEqual(problems("mi-pay-reconcile can read custarchive.", ["H9"]),
                         ["Sentence 1: activity wording without a cited observed-activity item."])

    def test_book_observed_activity_item(self) -> None:
        item = support.json_block_starting("chapters/08-data-flow.md", "id")
        text = "mi-pay-reconcile read 412 blobs from custarchive between 2026-09-01 and 2026-09-30."

        self.assertEqual(activity_problems(1, {"text": text, "cites": ["A1"]}, {"A1": item}), [])

    def test_capability_without_activity_words(self) -> None:
        self.assertEqual(problems("mi-pay-reconcile holds a data role.", ["H9"]), [])

    def test_activity_with_window(self) -> None:
        text = "pay-reconcile read settlement files between 2026-10-01 and 2026-10-07."

        self.assertEqual(problems(text, ["A1"]), [])

    def test_activity_without_window(self) -> None:
        self.assertEqual(problems("pay-reconcile read settlement files.", ["A1"]),
                         ["Sentence 1: activity from A1 stated without its window."])

    def test_item_without_recorded_window(self) -> None:
        self.assertEqual(len(problems("Files were downloaded.", ["A2"])), 1)

    def test_range_citation_and_unknown_ids(self) -> None:
        text = "The key was used between 2026-10-01 and 2026-10-07."

        self.assertEqual(problems(text, ["A1-A1", "Z9"]), [])

    def test_missing_text(self) -> None:
        self.assertEqual(activity_problems(2, {}, ITEMS), [])


if __name__ == "__main__":
    unittest.main()
