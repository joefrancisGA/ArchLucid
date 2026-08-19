#!/usr/bin/env python3
"""TB-2093: remove operator About … scope/details chrome."""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
UI_SRC = REPO / "archlucid-ui" / "src"


def write_preserving_newlines(path: Path, text_lf: str) -> None:
    raw = path.read_bytes()
    newline = b"\r\n" if b"\r\n" in raw else b"\n"
    path.write_bytes(text_lf.replace("\n", newline.decode("ascii")).encode("utf-8"))


def remove_about_collapsible_sections(text: str) -> str:
    # CollapsibleSection with title={...SCOPE_DETAILS_TRIGGER} or title="About …"
    pattern = re.compile(
        r"\n?\s*<CollapsibleSection\b[^>]*?"
        r"(?:title=\{[^}]*SCOPE_DETAILS_TRIGGER[^}]*\}|title=\"About [^\"]+\")"
        r"[^>]*>.*?</CollapsibleSection>\s*",
        re.S,
    )
    return pattern.sub("\n", text)


def strip_about_collapsible_guidance(text: str) -> str:
    # LayerHeader collapsibleGuidance={...LAYER_GUIDANCE...} or ="About …"
    out = text
    out = re.sub(
        r"\s*collapsibleGuidance=\{[^}]*LAYER_GUIDANCE_TRIGGER[^}]*\}\s*",
        "\n",
        out,
    )
    out = re.sub(
        r"\s*collapsibleGuidance=\{[^}]*SCOPE_DETAILS_TRIGGER[^}]*\}\s*",
        "\n",
        out,
    )
    out = re.sub(
        r'\s*collapsibleGuidance="About [^"]+"\s*',
        "\n",
        out,
    )
    # ternary that only picks About guidance
    out = re.sub(
        r"\s*collapsibleGuidance=\{\s*[^}]*\?[^}]*LAYER_GUIDANCE_TRIGGER[^}]*:\s*undefined\s*\}\s*",
        "\n",
        out,
    )
    return out


def strip_unused_about_imports(text: str) -> str:
    # Drop named imports that are only SCOPE/LAYER About triggers if unused after strip.
    def scrub_import_block(match: re.Match[str]) -> str:
        body = match.group(1)
        source = match.group(2)
        names = [n.strip() for n in body.split(",") if n.strip()]
        kept: list[str] = []
        rest = text[: match.start()] + text[match.end() :]
        for name in names:
            bare = name.split(" as ")[0].strip()
            if not bare:
                continue
            if re.search(rf"\b{re.escape(bare)}\b", rest):
                kept.append(name)
        if not kept:
            return ""
        if len(kept) == 1 and "\n" not in body:
            return f"import {{ {kept[0]} }} from {source};\n"
        inner = ",\n  ".join(kept)
        return f"import {{\n  {inner},\n}} from {source};\n"

    return re.sub(
        r"import \{\s*([^}]+)\}\s*from\s+(\"[^\"]+\"|'[^']+');\s*\n",
        scrub_import_block,
        text,
    )


def main() -> None:
    changed = 0
    for path in UI_SRC.rglob("*"):
        if not path.is_file() or path.suffix not in {".ts", ".tsx"}:
            continue
        posix = path.as_posix().replace("\\", "/")
        if "/marketing/" in posix or "/components/marketing/" in posix:
            continue

        original = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
        updated = remove_about_collapsible_sections(original)
        updated = strip_about_collapsible_guidance(updated)
        if updated != original:
            updated = strip_unused_about_imports(updated)
            updated = re.sub(r"\n{3,}", "\n\n", updated)
            write_preserving_newlines(path, updated)
            changed += 1
            print("updated", path.relative_to(UI_SRC))

    print("changed", changed)


if __name__ == "__main__":
    main()
