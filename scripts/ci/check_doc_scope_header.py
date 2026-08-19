#!/usr/bin/env python3
r"""
check_doc_scope_header.py
-------------------------
Enforces a small documentation hygiene invariant: every active ``docs/**/*.md``
file must open with a **Scope** line so readers (and agents) know audience,
intent, and boundaries before the first heading.

**Rule (active docs under ``docs/`` — excluding ``docs/archive/`` by default)**

After optional UTF-8 BOM and leading blank lines, the first non-empty line must
match::

    ^\s*>\s*\*\*Scope:\*\*

That is a GFM **blockquote** whose visible text starts with ``**Scope:**``.
Additional text on the same line is allowed (and encouraged) after the colon.
Optional contiguous blockquote rows may declare ``**Status:**`` (**draft**, **current**,
**deprecated** — first word after the colon wins; stray prose must follow that keyword).

**Optional README.md (repo root)**

The root ``README.md`` is not under ``docs/``. When ``--check-readme`` is set
(default: on), the same "first non-empty line" rule applies, but the scope may
alternatively be expressed as a single-line HTML comment::

    <!-- **Scope:** ... -->

Why HTML for README: the file is overwhelmingly H1-first for GitHub rendering;
a leading ``>`` blockquote would push the product title below a quote box.

**Two modes**

*Full scan* (default) walks the whole docs tree. It is **advisory** in CI: the
historical backlog of headerless files is large enough that a whole-tree gate
could never be switched on, so it runs warn-only to keep the remaining count
visible.

*Changed-only* (``--changed-only --base-ref <ref>``) checks just the markdown a
branch touched. This is the **merge-blocking** mode — a ratchet. New and edited
docs must comply; untouched legacy files do not block, and the backlog can only
shrink. Use ``scripts/ci/backfill_doc_scope_headers.py`` for the mechanical
prepend when reducing it deliberately.

Exit codes
~~~~~~~~~~
* ``0`` — every scanned file satisfies the rule (or nothing in scope changed).
* ``1`` — one or more files are missing a valid scope header.
* ``2`` — bad invocation, or the ``git diff`` for ``--changed-only`` failed.

Run::

    python scripts/ci/check_doc_scope_header.py
    python scripts/ci/check_doc_scope_header.py --no-check-readme
    python scripts/ci/check_doc_scope_header.py --changed-only --base-ref origin/main
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

UTF8_BOM = "\ufeff"

# First non-empty line must be a blockquote starting with **Scope:**
SCOPE_BLOCKQUOTE_RE = re.compile(r"^\s*>\s*\*\*Scope:\*\*", re.IGNORECASE)

# Optional metadata blockquotes immediately after Scope (same opening block — may include bare `>` lines).
STATUS_LINE_RE = re.compile(r"^\s*>\s*\*\*Status:\*\*\s*(.+?)\s*$", re.IGNORECASE)

ALLOWED_SCOPE_STATUS_VALUES = frozenset({"draft", "current", "deprecated"})

# README-only: single-line HTML comment starting with <!-- **Scope:**
SCOPE_README_HTML_RE = re.compile(r"^\s*<!--\s*\*\*Scope:\*\*", re.IGNORECASE)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def strip_leading_bom_and_blank_lines(text: str) -> str:
    if text.startswith(UTF8_BOM):
        text = text[len(UTF8_BOM) :]

    lines = text.splitlines()

    start = 0

    while start < len(lines) and not lines[start].strip():
        start += 1

    return "\n".join(lines[start:])


def first_non_empty_line(text: str) -> str | None:
    stripped = strip_leading_bom_and_blank_lines(text)

    if not stripped:
        return None

    first_line = stripped.splitlines()[0]

    return first_line if first_line.strip() else None


def iter_leading_blockquote_lines(lines: list[str]) -> list[str]:
    collected: list[str] = []

    for raw in lines:
        stripped = raw.strip()

        if not stripped:
            continue

        if stripped.startswith(">"):
            collected.append(raw.rstrip())

            continue

        break

    return collected


def docs_scope_metadata_violations_from_blockquotes(blockquotes: list[str]) -> list[str]:
    """If **Status:** appears in the leading blockquote run, validate its keyword."""
    errs: list[str] = []

    for raw in blockquotes[1:]:
        status_m = STATUS_LINE_RE.match(raw)

        if not status_m:
            continue

        first_token = status_m.group(1).strip().split(None, 1)[0].lower()

        while first_token and first_token[0] in "(['\"":
            first_token = first_token[1:].lower()

        first_token = first_token.rstrip(".,;:)]}'\"")

        if first_token not in ALLOWED_SCOPE_STATUS_VALUES:
            errs.append(
                f"invalid **Status:** value {first_token!r} "
                f"(allowed: {', '.join(sorted(ALLOWED_SCOPE_STATUS_VALUES))})"
            )

    return errs


def docs_scope_validation_errors(content: str) -> list[str]:
    stripped = strip_leading_bom_and_blank_lines(content)

    if not stripped:
        return ["missing content"]

    lines = stripped.splitlines()
    first = lines[0] if lines else ""

    errs: list[str] = []

    if not first.strip():
        errs.append("missing first non-empty line")

        return errs

    if not SCOPE_BLOCKQUOTE_RE.match(first):
        errs.append("first non-empty line is not `> **Scope:**` blockquote")

        return errs

    blockquotes = iter_leading_blockquote_lines(lines)

    errs.extend(docs_scope_metadata_violations_from_blockquotes(blockquotes))

    return errs


def has_valid_docs_scope_header(content: str) -> bool:
    return len(docs_scope_validation_errors(content)) == 0


def has_valid_readme_scope_header(content: str) -> bool:
    first = first_non_empty_line(content)

    if first is None:
        return False

    if SCOPE_BLOCKQUOTE_RE.match(first):
        return True

    return bool(SCOPE_README_HTML_RE.match(first))


def iter_markdown_files(docs_dir: Path, *, exclude_archive: bool) -> list[Path]:
    if not docs_dir.is_dir():
        return []

    paths: list[Path] = []

    for path in sorted(docs_dir.rglob("*.md")):
        if not path.is_file():
            continue

        if exclude_archive:
            try:
                rel = path.relative_to(docs_dir)

                if rel.parts and rel.parts[0] == "archive":
                    continue
            except ValueError:
                continue

        paths.append(path)

    return paths


def is_within(path: Path, parent: Path) -> bool:
    """True when ``path`` sits inside ``parent`` (both resolved)."""
    try:
        path.relative_to(parent.resolve())

        return True
    except ValueError:
        return False


def git_diff_names(base_ref: str) -> list[str]:
    """Repo-relative paths changed between ``base_ref`` and ``HEAD``.

    Uses the three-dot form, which diffs from the **merge base** rather than the
    branch tip. Without it, commits that landed on the base branch after this
    branch forked would count as "changed here", and a contributor could be
    blocked by somebody else's headerless file.
    """
    completed = subprocess.run(
        ["git", "diff", "--name-only", f"{base_ref}...HEAD"],
        cwd=repo_root(),
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        detail = (completed.stderr or "").strip() or "unknown git error"

        raise RuntimeError(f"git diff against {base_ref!r} failed: {detail}")

    if not completed.stdout:
        return []

    return [line.strip() for line in completed.stdout.splitlines() if line.strip()]


def changed_scope_targets(
    base_ref: str,
    *,
    docs_dir: Path,
    exclude_archive: bool,
    check_readme: bool,
) -> tuple[list[Path], Path | None]:
    """Changed markdown this checker owns, as ``(docs files, README or None)``.

    Paths that no longer exist are dropped: a file the branch deleted cannot
    violate a header rule, and ``git diff --name-only`` still lists it.
    """
    root = repo_root()
    readme_path = (root / "README.md").resolve()

    docs_targets: list[Path] = []
    readme_target: Path | None = None

    for name in git_diff_names(base_ref):
        if not name.lower().endswith(".md"):
            continue

        absolute = (root / name).resolve()

        if not absolute.is_file():
            continue

        if absolute == readme_path:
            if check_readme:
                readme_target = absolute

            continue

        if not is_within(absolute, docs_dir):
            continue

        if exclude_archive and is_within(absolute, docs_dir / "archive"):
            continue

        docs_targets.append(absolute)

    return sorted(set(docs_targets)), readme_target


def readme_violations(readme: Path | None) -> list[str]:
    """Scope-header violations for the repo-root README, when it is in scope."""
    if readme is None:
        return []

    if not readme.is_file():
        print("::warning::README.md not found at repo root; skipping.", file=sys.stderr)

        return []

    text = readme.read_text(encoding="utf-8", errors="replace")

    if has_valid_readme_scope_header(text):
        return []

    return [str(readme.relative_to(repo_root()))]


def docs_violations(paths: list[Path]) -> list[str]:
    """Scope-header violations across ``paths``, formatted ``<rel>: <error>``."""
    violations: list[str] = []

    for md in paths:
        text = md.read_text(encoding="utf-8", errors="replace")

        doc_errs = docs_scope_validation_errors(text)

        if not doc_errs:
            continue

        try:
            label = str(md.relative_to(repo_root()))
        except ValueError:
            label = str(md)

        violations.extend([f"{label}: {e}" for e in doc_errs])

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=repo_root() / "docs",
        help="Root directory to scan (default: <repo>/docs).",
    )
    parser.add_argument(
        "--exclude-archive",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Skip docs/archive/** (default: true).",
    )
    parser.add_argument(
        "--check-readme",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Also validate repo root README.md (default: true).",
    )
    parser.add_argument(
        "--max-list",
        type=int,
        default=80,
        help="Maximum number of violating paths to print (default: 80).",
    )
    parser.add_argument(
        "--changed-only",
        action="store_true",
        help="Check only markdown changed vs --base-ref (merge-blocking ratchet mode).",
    )
    parser.add_argument(
        "--base-ref",
        default=None,
        help="Base ref for --changed-only, e.g. origin/main.",
    )

    args = parser.parse_args(argv)

    if args.changed_only and not args.base_ref:
        print("::error::--changed-only requires --base-ref (e.g. --base-ref origin/main).", file=sys.stderr)

        return 2

    if args.changed_only:
        try:
            docs_targets, readme_target = changed_scope_targets(
                args.base_ref,
                docs_dir=args.docs_dir,
                exclude_archive=args.exclude_archive,
                check_readme=args.check_readme,
            )
        except RuntimeError as exc:
            print(f"::error::{exc}", file=sys.stderr)

            return 2
    else:
        docs_targets = iter_markdown_files(args.docs_dir, exclude_archive=args.exclude_archive)
        readme_target = (repo_root() / "README.md") if args.check_readme else None

    violations = readme_violations(readme_target) + docs_violations(docs_targets)

    scanned = len(docs_targets) + (0 if readme_target is None else 1)

    if not violations:
        if args.changed_only:
            print(f"check_doc_scope_header: OK ({scanned} changed markdown file(s) in scope carry a scope header).")
        else:
            print(
                "check_doc_scope_header: OK (scope blockquote present on first non-empty line "
                f"for all scanned docs under {args.docs_dir}"
                + ("; README.md OK" if args.check_readme else "")
                + ")."
            )

        return 0

    # Changed-only is the blocking gate, so its findings are errors. The full scan stays a
    # warning: annotating 400+ legacy files as errors would bury real failures in noise.
    level = "error" if args.changed_only else "warning"

    print(
        f"::{level}::{len(violations)} markdown file(s) missing a leading `> **Scope:**` blockquote "
        f"(or README missing `<!-- **Scope:**`). First {min(len(violations), args.max_list)}:",
        file=sys.stderr,
    )

    for path in violations[: args.max_list]:
        print(f"  - {path}", file=sys.stderr)

    if len(violations) > args.max_list:
        print(f"  ... and {len(violations) - args.max_list} more.", file=sys.stderr)

    print("", file=sys.stderr)
    print(
        "Hint: add as line 1 (after optional BOM / blank lines): "
        '`> **Scope:** One sentence: audience, intent, and what this doc is not.`',
        file=sys.stderr,
    )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
