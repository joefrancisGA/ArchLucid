"""Fail when ``docs/library/CONNECTOR_READINESS_MATRIX.md`` links to missing files.

Validates:

- Relative markdown links ``[text](target)`` (same rules as ``assert_start_here_links_valid`` for skips).
- Backticked repo-relative paths that look like source or schema files (contain ``/`` and end with
  ``.cs`` / ``.md`` / ``.json``) — excludes table cells such as ``dbo.*`` that also use backticks.

Usage:
    python scripts/ci/assert_connector_readiness_matrix_paths.py
    python scripts/ci/assert_connector_readiness_matrix_paths.py --repo-root /path/to/repo
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote

LINK_RE = re.compile(r"(?<!\!)\[[^\]]*\]\(([^()]*(?:\([^()]*\))*[^()]*)\)")

MATRIX_REL = Path("docs/library/CONNECTOR_READINESS_MATRIX.md")

# Repo-relative paths in backticks: ArchLucid.*/*.cs, docs/..., schemas/..., templates/...
_BACKTICK_PATH_RE = re.compile(
    r"`((?:ArchLucid\.[^`\s]+|docs/[^`\s]+|schemas/[^`\s]+|templates/[^`\s]+)\.(?:cs|md|json))`"
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def should_skip_target(raw: str) -> bool:
    t = raw.strip()

    if not t or t.startswith("#"):
        return True

    if t.startswith("http://") or t.startswith("https://"):
        return True

    if t.startswith("mailto:") or t.startswith("tel:"):
        return True

    if "{" in t or "*" in t:
        return True

    return False


def resolve_markdown_link(md_file: Path, target: str) -> Path | None:
    t = target.strip()
    pos = t.find("#")

    if pos >= 0:
        t = t[:pos].strip()

    if not t or should_skip_target(t):
        return None

    t = unquote(t)
    resolved = (md_file.parent / t).resolve()
    root = repo_root()

    try:
        resolved.relative_to(root)
    except ValueError:
        return None

    return resolved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    args = parser.parse_args()
    root: Path = args.repo_root.resolve()
    md_path = root / MATRIX_REL

    if not md_path.is_file():
        print(f"Missing required file: {md_path}", file=sys.stderr)
        return 2

    text = md_path.read_text(encoding="utf-8")
    missing: list[str] = []

    for match in LINK_RE.finditer(text):
        raw = match.group(1).strip()
        resolved = resolve_markdown_link(md_path, raw)

        if resolved is None:
            continue

        if not resolved.is_file():
            missing.append(f"link {raw} -> {resolved}")

    for match in _BACKTICK_PATH_RE.finditer(text):
        raw = match.group(1).strip()
        candidate = (root / Path(raw)).resolve()

        try:
            candidate.relative_to(root)
        except ValueError:
            missing.append(f"backtick-path escapes repo: `{raw}`")
            continue

        if not candidate.is_file():
            missing.append(f"backtick `{raw}` -> missing {candidate}")

    if missing:
        print(
            "assert_connector_readiness_matrix_paths: broken links or missing backtick paths:",
            file=sys.stderr,
        )

        for line in missing:
            print(f"  {line}", file=sys.stderr)

        return 1

    print("assert_connector_readiness_matrix_paths: OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
