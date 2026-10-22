#!/usr/bin/env python3
"""British -> American spelling normalization for git-tracked text files."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SKIP_FILE_NAMES = {"package-lock.json", "americanize-spelling.py"}

TEXT_SUFFIXES = {
    ".md", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".cs", ".json", ".sql", ".py",
    ".ps1", ".yml", ".yaml", ".xml", ".html", ".css", ".snap", ".txt",
}

BRITISH_PATTERN = re.compile(
    r"\b("
    r"behaviours?|labour|colours?|favou?rs?|favoured|centres?|organisations?|"
    r"organis(?:e|es|ed|ing)|programmes?|honou?rs?|honou?red|honou?ring|"
    r"catalogues?|optimis(?:e|es|ed|ing|ations?)|realis(?:e|es|ed|ing)|"
    r"defences?|judgements?|customis(?:e|es|ed|ing)|authoris(?:e|es|ed|ing)|"
    r"recognis(?:e|es|ed|ing)|summaris(?:e|es|ed|ing)|prioritis(?:e|es|ed|ing)|"
    r"finalis(?:e|es|ed|ing)|visualis(?:e|es|ed|ing)|localis(?:e|es|ed|ing)|"
    r"analys(?:e|es|ed|ing)|standardis(?:e|es|ed|ing)|normalis(?:e|es|ed|ing)|"
    r"synchronis(?:e|es|ed|ing)|utilis(?:e|es|ed|ing)|minimis(?:e|es|ed|ing)|"
    r"maximis(?:e|es|ed|ing)|emphasis(?:e|es|ed|ing)|categoris(?:e|es|ed|ing)|"
    r"specialis(?:e|es|ed|ing)|initialis(?:e|es|ed|ing)|fulfil(?:s|ment)?|"
    r"neighbours?|theatres?|metres?|litres?|manoeuvres?|greys?"
    r")\b",
    re.IGNORECASE,
)

REPLACEMENTS: dict[str, str] = {
    "behaviours": "behaviors",
    "behaviour": "behavior",
    "labour": "labor",
    "colours": "colors",
    "colour": "color",
    "favoured": "favored",
    "favours": "favors",
    "favour": "favor",
    "centres": "centers",
    "centre": "center",
    "organisations": "organizations",
    "organisation": "organization",
    "organising": "organizing",
    "organised": "organized",
    "organises": "organizes",
    "organise": "organize",
    "programmes": "programs",
    "programme": "program",
    "honouring": "honoring",
    "honoured": "honored",
    "honours": "honors",
    "honour": "honor",
    "catalogues": "catalogs",
    "catalogue": "catalog",
    "optimisations": "optimizations",
    "optimisation": "optimization",
    "optimising": "optimizing",
    "optimised": "optimized",
    "optimise": "optimize",
    "realising": "realizing",
    "realised": "realized",
    "realise": "realize",
    "defences": "defenses",
    "defence": "defense",
    "judgements": "judgments",
    "judgement": "judgment",
    "customising": "customizing",
    "customised": "customized",
    "customise": "customize",
    "authorising": "authorizing",
    "authorised": "authorized",
    "authorise": "authorize",
    "recognising": "recognizing",
    "recognised": "recognized",
    "recognise": "recognize",
    "summarising": "summarizing",
    "summarised": "summarized",
    "summarise": "summarize",
    "prioritising": "prioritizing",
    "prioritised": "prioritized",
    "prioritise": "prioritize",
    "finalising": "finalizing",
    "finalised": "finalized",
    "finalise": "finalize",
    "visualising": "visualizing",
    "visualised": "visualized",
    "visualise": "visualize",
    "localising": "localizing",
    "localised": "localized",
    "localise": "localize",
    "analysing": "analyzing",
    "analysed": "analyzed",
    "analyse": "analyze",
    "standardising": "standardizing",
    "standardised": "standardized",
    "standardise": "standardize",
    "normalising": "normalizing",
    "normalised": "normalized",
    "normalise": "normalize",
    "synchronising": "synchronizing",
    "synchronised": "synchronized",
    "synchronise": "synchronize",
    "utilising": "utilizing",
    "utilised": "utilized",
    "utilise": "utilize",
    "minimising": "minimizing",
    "minimised": "minimized",
    "minimise": "minimize",
    "maximising": "maximizing",
    "maximised": "maximized",
    "maximise": "maximize",
    "emphasising": "emphasizing",
    "emphasised": "emphasized",
    "emphasise": "emphasize",
    "categorising": "categorizing",
    "categorised": "categorized",
    "categorise": "categorize",
    "specialising": "specializing",
    "specialised": "specialized",
    "specialise": "specialize",
    "initialising": "initializing",
    "initialised": "initialized",
    "initialise": "initialize",
    "fulfilment": "fulfillment",
    "fulfils": "fulfills",
    "fulfil": "fulfill",
    "neighbours": "neighbors",
    "neighbour": "neighbor",
    "theatres": "theaters",
    "theatre": "theater",
    "metres": "meters",
    "metre": "meter",
    "litres": "liters",
    "litre": "liter",
    "manoeuvres": "maneuvers",
    "manoeuvre": "maneuver",
    "greys": "grays",
    "grey": "gray",
}

STRING_CANCELLED = [
    (re.compile(r'"([^"]*\b)cancelled(\b[^"]*)"'), r'"\1canceled\2"'),
    (re.compile(r"'([^']*\b)cancelled(\b[^']*)'"), r"'\1canceled\2'"),
    (re.compile(r"`([^`]*\b)cancelled(\b[^`]*)`"), r"`\1canceled\2`"),
]


def preserve_case(source: str, target: str) -> str:
    if source.isupper():
        return target.upper()

    if source[0].isupper():
        return target[0].upper() + target[1:]

    return target


def replace_word(match: re.Match[str]) -> str:
    word = match.group(0)
    replacement = REPLACEMENTS.get(word.lower())

    if replacement is None:
        return word

    return preserve_case(word, replacement)


def americanize(text: str) -> str:
    updated = BRITISH_PATTERN.sub(replace_word, text)

    for pattern, replacement in STRING_CANCELLED:
        updated = pattern.sub(replacement, updated)

    return updated


def iter_target_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
    )
    paths: list[Path] = []

    for relative in result.stdout.decode("utf-8").split("\0"):
        if not relative:
            continue

        path = REPO_ROOT / relative

        if path.name in SKIP_FILE_NAMES:
            continue

        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue

        paths.append(path)

    return paths


def main() -> int:
    changed_files: list[Path] = []

    for path in iter_target_files():
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        if not BRITISH_PATTERN.search(original) and "cancelled" not in original:
            continue

        updated = americanize(original)

        if updated == original:
            continue

        try:
            path.write_text(updated, encoding="utf-8")
        except OSError as error:
            print(f"SKIP write failed: {path.relative_to(REPO_ROOT)} ({error})")
            continue

        changed_files.append(path)

    print(f"Updated {len(changed_files)} files.")
    for path in sorted(changed_files):
        print(path.relative_to(REPO_ROOT))

    return 0


if __name__ == "__main__":
    sys.exit(main())
