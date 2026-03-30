"""
Collapse multiline simple auto-properties to a single line.

Remove blank lines between adjacent one-line `{ get; set; }` properties.

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


def _is_simple_get_set_property_line(raw: str) -> bool:
    """True for a single-line declaration that uses auto get/set (may include initializer)."""
    s = raw.rstrip("\r\n")
    if not s.strip():
        return False

    t = s.lstrip()

    if t.startswith("//"):
        return False

    if "=>" in s:
        return False

    if re.search(r"\b(event|delegate)\b", s):
        return False

    return bool(re.search(r"\{\s*get;\s*set;\s*\}", s))


def remove_adjacent_simple_get_set_property_blanks(text: str) -> str:
    """Drop blank lines between back-to-back simple `{ get; set; }` property lines."""
    lines = text.splitlines(keepends=True)
    if len(lines) < 3:
        return text

    out: list[str] = []
    i = 0

    while i < len(lines):
        if (
            i + 2 < len(lines)
            and _is_simple_get_set_property_line(lines[i])
            and lines[i + 1].strip() == ""
            and _is_simple_get_set_property_line(lines[i + 2])
        ):
            out.append(lines[i])
            i += 2

            continue

        out.append(lines[i])
        i += 1

    return "".join(out)


def collapse_multiline_simple_properties(text: str) -> str:
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


def transform(text: str) -> str:
    text = collapse_multiline_simple_properties(text)
    text = remove_adjacent_simple_get_set_property_blanks(text)

    return text


def _load_normalized(path: Path) -> tuple[str, bool]:
    data = path.read_bytes()
    had_crlf = b"\r\n" in data
    text = data.decode("utf-8-sig")
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    return text, had_crlf


def _save_normalized(path: Path, text: str, had_crlf: bool) -> None:
    out = text.replace("\n", "\r\n") if had_crlf else text
    path.write_bytes(out.encode("utf-8"))


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    skip_parts = {"bin", "obj", ".git"}
    total_files = 0

    for path in sorted(root.rglob("*.cs")):
        if any(p in path.parts for p in skip_parts):
            continue
        original, had_crlf = _load_normalized(path)
        updated = transform(original)

        if updated != original:
            _save_normalized(path, updated, had_crlf)
            total_files += 1

    print(f"Updated {total_files} file(s).", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
