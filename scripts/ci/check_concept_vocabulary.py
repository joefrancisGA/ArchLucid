"""CI guard: enforce ArchLucid concept vocabulary rules from ``docs/CONCEPTS.md``.

The guard is intentionally **conservative**: only rules in the ``RULES`` list
below are enforced. Each rule cites the ``docs/CONCEPTS.md`` row that
authorizes it. The guard scans every Markdown file under ``docs/`` *except*
``docs/archive/`` (historical receipts; never retroactively rewritten) and
``docs/CONCEPTS.md`` itself (which legitimately quotes the rejected forms
inside its rationale text).

A new rule must:
  1. land as a row in ``docs/CONCEPTS.md`` § 1 first;
  2. survive one full release cycle as reviewer-enforced (§ 1.2);
  3. only then be promoted into the ``RULES`` list here, with every existing
     occurrence in ``docs/`` already fixed in the same PR.

Usage:
    python scripts/ci/check_concept_vocabulary.py
    python scripts/ci/check_concept_vocabulary.py --repo-root /path/to/repo

Exit codes:
    0 — no violations
    1 — at least one violation (paths + line numbers printed)
    2 — invocation error (bad repo root, missing ``docs/`` directory)
"""

from __future__ import annotations

import argparse
import dataclasses
import pathlib
import re
import sys

DOCS_DIR_NAME: str = "docs"

# Files inside docs/ that the guard never scans. ``docs/archive/`` is the
# historical-receipts directory; the rules file itself legitimately quotes
# the rejected forms inside its rationale.
EXCLUDED_RELATIVE_PATHS: frozenset[str] = frozenset({
    "archive",
    "CONCEPTS.md",
})


@dataclasses.dataclass(frozen=True)
class VocabularyRule:
    """One canonical-vs-rejected vocabulary rule from ``docs/CONCEPTS.md``."""

    canonical: str
    rejected_pattern: re.Pattern[str]
    docs_concepts_row: int
    rationale: str
    fix_hint: str


# Initial enforced rule set. New rules must follow the promotion gate in
# ``docs/CONCEPTS.md`` § 3.
RULES: list[VocabularyRule] = [
    VocabularyRule(
        canonical="Microsoft Entra ID",
        # Match either "Azure Active Directory" or "Azure AD" as a whole token
        # (the trailing word boundary on "Azure AD" prevents matching "Azure ADX").
        rejected_pattern=re.compile(r"\b(?:Azure Active Directory|Azure AD)\b"),
        docs_concepts_row=1,
        rationale="Microsoft renamed Azure Active Directory to Microsoft Entra ID in 2023; "
                  "continued use confuses customers and contradicts SECURITY.md.",
        fix_hint='Replace "Azure Active Directory" / "Azure AD" with "Microsoft Entra ID".',
    ),
]


@dataclasses.dataclass(frozen=True)
class Violation:
    """A single rule violation in a docs file."""

    path: pathlib.Path
    line_number: int
    matched_text: str
    rule: VocabularyRule


def find_violations(
    repo_root: pathlib.Path,
    rules: list[VocabularyRule],
    excluded_relative_paths: frozenset[str] = EXCLUDED_RELATIVE_PATHS,
) -> list[Violation]:
    """Return every rule violation under ``repo_root/docs/``.

    Pure function — accepts every input it depends on so unit tests can drive
    it against a temp tree without touching the real repository.

    >>> find_violations(pathlib.Path('.'), [])  # noqa: returns [] when no rules
    []
    """

    if repo_root is None: raise ValueError("repo_root is required")
    if not repo_root.exists(): raise FileNotFoundError(repo_root)
    if not repo_root.is_dir(): raise NotADirectoryError(repo_root)

    docs_dir = repo_root / DOCS_DIR_NAME

    if not docs_dir.exists(): raise FileNotFoundError(docs_dir)

    if not rules: return []

    violations: list[Violation] = []

    for markdown_path in sorted(docs_dir.rglob("*.md")):
        if _is_excluded(markdown_path, docs_dir, excluded_relative_paths): continue

        try:
            text = markdown_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = markdown_path.read_text(encoding="utf-8", errors="replace")

        for line_index, line in enumerate(text.splitlines(), start=1):
            for rule in rules:
                for match in rule.rejected_pattern.finditer(line):
                    violations.append(Violation(
                        path=markdown_path,
                        line_number=line_index,
                        matched_text=match.group(0),
                        rule=rule,
                    ))

    return violations


def _is_excluded(
    markdown_path: pathlib.Path,
    docs_dir: pathlib.Path,
    excluded_relative_paths: frozenset[str],
) -> bool:
    """Return True when the file or any of its parents is in the exclusion set."""

    relative = markdown_path.relative_to(docs_dir)

    for part in relative.parts:
        if part in excluded_relative_paths: return True

    if relative.as_posix() in excluded_relative_paths: return True

    return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--repo-root",
        type=pathlib.Path,
        default=pathlib.Path.cwd(),
        help="Repository root to scan (defaults to current working directory).",
    )

    args = parser.parse_args(argv)

    if not args.repo_root.exists():
        print(f"::error::repo root does not exist: {args.repo_root}", file=sys.stderr)
        return 2

    docs_dir = args.repo_root / DOCS_DIR_NAME
    if not docs_dir.exists():
        print(f"::error::docs directory not found: {docs_dir}", file=sys.stderr)
        return 2

    try:
        violations = find_violations(args.repo_root, RULES)
    except (FileNotFoundError, NotADirectoryError, ValueError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        return 2

    if not violations:
        rule_count = len(RULES)
        print(f"OK: no concept-vocabulary violations under {docs_dir} ({rule_count} rule(s) checked).")
        return 0

    print(f"::error::Found {len(violations)} concept-vocabulary violation(s):")
    for violation in violations:
        relative = violation.path.relative_to(args.repo_root).as_posix()
        print(f"  {relative}:{violation.line_number} - matched '{violation.matched_text}' (rule #{violation.rule.docs_concepts_row}: {violation.rule.fix_hint})")

    print(
        "\nRemediation: see docs/CONCEPTS.md § 1 for the canonical form and "
        "rationale for each rule. Historical archive content under docs/archive/ "
        "is exempt; CONCEPTS.md itself is also exempt because it legitimately "
        "quotes the rejected forms in its own rationale.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
