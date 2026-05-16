"""Patch repo paths after moving docs/adr -> docs/architecture/adr. Run once then delete."""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIR_NAMES = frozenset({"node_modules", ".git", "bin", "obj", ".venv", "__pycache__"})
ADR_ROOT = ROOT / "docs" / "architecture" / "adr"
TEXT_SUFFIXES = frozenset({".md", ".mdc", ".py", ".json", ".cs", ".yml", ".yaml", ".csproj"})

PAREN_ADR = re.compile(r"\]\(adr/([^)]+)\)")


def skip_path(path: Path) -> bool:
    return any(part in SKIP_DIR_NAMES for part in path.parts)


def fix_paren_adr(content: str, file_path: Path) -> str:
    """Rewrite ](adr/foo.md) to a correct relative path to docs/architecture/adr/foo.md."""

    def repl(match: re.Match[str]) -> str:
        tail = match.group(1)
        target = ADR_ROOT / tail
        rel = Path(os.path.relpath(target, file_path.parent)).as_posix()
        return f"]({rel})"

    return PAREN_ADR.sub(repl, content)


def process_file(path: Path) -> None:
    if path.suffix.lower() not in TEXT_SUFFIXES:
        return

    try:
        original = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return

    text = original
    text = text.replace("docs/adr/", "docs/architecture/adr/")
    text = text.replace("docs\\adr\\", "docs\\architecture\\adr\\")
    text = text.replace("../../adr/", "../../architecture/adr/")
    text = text.replace("../adr/", "../architecture/adr/")
    text = text.replace("tree/main/docs/adr", "tree/main/docs/architecture/adr")

    rel_parts = path.relative_to(ROOT).parts
    if (
        len(rel_parts) == 3
        and rel_parts[0] == "docs"
        and rel_parts[1] == "architecture"
        and path.suffix.lower() == ".md"
    ):
        text = text.replace("](../architecture/adr/", "](adr/")
        text = text.replace("](../architecture/adr/", "](adr/")

    text = fix_paren_adr(text, path)

    if text != original:
        path.write_text(text, encoding="utf-8", newline="\n")


def main() -> None:
    if not ADR_ROOT.is_dir():
        raise SystemExit(f"Expected ADR directory at {ADR_ROOT}")

    for path in ROOT.rglob("*"):
        if path.is_dir():
            continue

        if skip_path(path):
            continue

        process_file(path)


if __name__ == "__main__":
    main()
