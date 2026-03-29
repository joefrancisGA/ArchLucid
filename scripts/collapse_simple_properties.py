"""
Collapse multiline simple auto-properties to a single line.

Run from repo root: python scripts/collapse_simple_properties.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def _should_skip_decl(decl: str) -> bool:
    d = decl.strip()
    if "(" in d and ")" in d:
        return True
    if "=>" in d:
        return True
    if d.endswith("{"):
        return True
    parts = d.split()
    if not parts:
        return True
    if parts[0] in (
        "class",
        "interface",
        "struct",
        "enum",
        "record",
        "event",
        "delegate",
        "namespace",
        "using",
    ):
        return True
    return False


def _build_patterns() -> list[re.Pattern[str]]:
    # Named groups: prefix (attrs), ind, decl. Brace indent must match ind.
    return [
        re.compile(
            r"(?P<prefix>(?:^[ \t]*\[[^\]]+\]\s*\r?\n)*)"
            r"^(?P<ind>[ \t]*)(?P<decl>[^\r\n]+)\r?\n"
            r"(?P=ind)\{\s*\r?\n"
            r"(?P=ind)[ \t]*get;\s*set;\s*\r?\n"
            r"(?P=ind)\}",
            re.MULTILINE,
        ),
        re.compile(
            r"(?P<prefix>(?:^[ \t]*\[[^\]]+\]\s*\r?\n)*)"
            r"^(?P<ind>[ \t]*)(?P<decl>[^\r\n]+)\r?\n"
            r"(?P=ind)\{\s*\r?\n"
            r"(?P=ind)[ \t]*get;\s*\r?\n"
            r"(?P=ind)[ \t]*set;\s*\r?\n"
            r"(?P=ind)\}",
            re.MULTILINE,
        ),
        re.compile(
            r"(?P<prefix>(?:^[ \t]*\[[^\]]+\]\s*\r?\n)*)"
            r"^(?P<ind>[ \t]*)(?P<decl>[^\r\n]+)\r?\n"
            r"(?P=ind)\{\s*\r?\n"
            r"(?P=ind)[ \t]*get;\s*init;\s*\r?\n"
            r"(?P=ind)\}",
            re.MULTILINE,
        ),
        re.compile(
            r"(?P<prefix>(?:^[ \t]*\[[^\]]+\]\s*\r?\n)*)"
            r"^(?P<ind>[ \t]*)(?P<decl>[^\r\n]+)\r?\n"
            r"(?P=ind)\{\s*\r?\n"
            r"(?P=ind)[ \t]*get;\s*\r?\n"
            r"(?P=ind)\}",
            re.MULTILINE,
        ),
    ]


def _replace_one(text: str, cre: re.Pattern[str]) -> tuple[str, bool]:
    pos = 0
    while True:
        m = cre.search(text, pos)
        if not m:
            return text, False
        decl = m.group("decl")
        if _should_skip_decl(decl):
            pos = m.end()
            continue
        prefix = m.group("prefix")
        ind = m.group("ind")
        if "get; set;" in m.group(0):
            body = "{ get; set; }"
        elif "get; init;" in m.group(0):
            body = "{ get; init; }"
        elif "get;" in m.group(0) and "set;" in m.group(0):
            body = "{ get; set; }"
        else:
            body = "{ get; }"
        replacement = f"{prefix}{ind}{decl} {body}"
        text = text[: m.start()] + replacement + text[m.end() :]
        return text, True


def transform(text: str) -> str:
    patterns = _build_patterns()
    changed_any = True

    while changed_any:
        changed_any = False
        for cre in patterns:
            while True:
                text, did = _replace_one(text, cre)
                if not did:
                    break
                changed_any = True
    return text


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    skip_parts = {"bin", "obj", ".git"}
    total_files = 0

    for path in sorted(root.rglob("*.cs")):
        if any(p in path.parts for p in skip_parts):
            continue
        original = path.read_text(encoding="utf-8")
        updated = transform(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="\n")
            total_files += 1

    print(f"Updated {total_files} file(s).", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
