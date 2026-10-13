"""Chapter 8 listings: the activity-wording rule.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch08_data_flow.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations

from ch09_validator import expand_range


# region activity_problems
import re

ACTIVITY_WORDS = re.compile(
    r"\b(?:read|wrote|accessed|downloaded|exfiltrat\w*|exposed|stole|stolen|breach\w*"
    r"|compromised)\b|\bwas used\b",
    re.IGNORECASE,
)


def activity_problems(index: int, sentence: dict, items: dict) -> list[str]:
    """Activity wording needs a cited observed-activity item and its time window in the sentence."""
    text = sentence.get("text") or ""

    if not ACTIVITY_WORDS.search(text):
        return []

    cited = [items[c] for raw in sentence.get("cites", []) for c in expand_range(raw) if c in items]
    observed = [item for item in cited if item.get("category") == "observed activity"]

    if not observed:
        return [f"Sentence {index}: activity wording without a cited observed-activity item."]

    problems: list[str] = []

    for item in observed:
        window = item.get("window") or {}
        start = window.get("start")
        end = window.get("end")

        if not start or not end or start not in text or end not in text:
            problems.append(
                f"Sentence {index}: activity from {item['id']} stated without its window."
            )

    return problems
# endregion activity_problems
