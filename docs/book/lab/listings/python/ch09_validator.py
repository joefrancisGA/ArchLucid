"""Chapter 9 listings: the draft validator.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch09_validator.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region validate
import re

ACTIVITY_PATTERNS = [
    r"\baccessed\b", r"\bexfiltrat\w*", r"\bstole\b", r"\bstolen\b",
    r"\bbreach\w*", r"\bhas been exposed\b", r"\bwas used\b", r"\bcompromised\b",
]
NUMBER_PATTERN = re.compile(r"\b\d+(?:[.,]\d+)?%?")
NAME_PATTERN = re.compile(r"`([^`]+)`|\b([a-z]+(?:-[a-z0-9]+)+)\b")
# Item fields a draft may draw names and numbers from. untrustedText is deliberately absent.
SOURCE_FIELDS = ("claim", "target", "assertedBy", "assertedAt", "expiresAt")


def expand_range(citation: str) -> list[str]:
    """Turn 'P1-P3' or 'P1–P3' into ['P1', 'P2', 'P3']; leave single IDs alone."""
    match = re.fullmatch(r"([A-Z])(\d+)[-\u2013]\1?(\d+)", citation)

    if not match:
        return [citation]

    prefix, start, end = match.group(1), int(match.group(2)), int(match.group(3))

    return [f"{prefix}{n}" for n in range(start, end + 1)]


def validate(draft: dict, pack: dict) -> list[str]:
    items = {
        item["id"]: item
        for key in ("hops", "paths", "targets", "gaps", "cutPoints")
        for item in pack.get(key, [])
    }
    sources = [pack.get("snapshotId", "")]
    sources += [
        str(item[field]) for item in items.values() for field in SOURCE_FIELDS if field in item
    ]
    pack_text = " ".join(sources)
    pack_numbers = set(NUMBER_PATTERN.findall(pack_text)) | {str(len(pack.get("paths", [])))}
    problems: list[str] = []

    if draft.get("status") == "insufficient_evidence" and draft.get("sentences"):
        problems.append("Draft sets status insufficient_evidence but still returns sentences.")

    for index, sentence in enumerate(draft.get("sentences", []), start=1):
        text = sentence.get("text", "")
        cites = [c for raw in sentence.get("cites", []) for c in expand_range(raw)]

        if not cites:
            problems.append(f"Sentence {index}: no citation.")

        for cite in cites:
            if cite not in items:
                problems.append(f"Sentence {index}: cites unknown ID {cite}.")

        for pattern in ACTIVITY_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                problems.append(
                    f"Sentence {index}: activity wording '{pattern}' "
                    "with no observed activity in the pack."
                )

        for number in NUMBER_PATTERN.findall(text):
            if number not in pack_numbers:
                problems.append(f"Sentence {index}: number '{number}' does not appear in the pack.")

        for match in NAME_PATTERN.finditer(text):
            name = match.group(1) or match.group(2)

            if name and name not in pack_text:
                problems.append(f"Sentence {index}: name '{name}' does not appear in the pack.")

    # A path resting on an unmodeled control lists that gap; citing the path means citing the gap.
    cited = {c for sentence in draft.get("sentences", [])
             for raw in sentence.get("cites", []) for c in expand_range(raw)}

    for path in pack.get("paths", []):
        for gap in path.get("gaps", []):
            if path["id"] in cited and gap not in cited:
                problems.append(f"Draft cites {path['id']} but not its gap {gap}.")

    return problems
# endregion validate
