#!/usr/bin/env python3
"""TB-2092: delete operator EvidenceOrientation / Sources strips (keep Cite + marketing)."""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
UI_SRC = REPO / "archlucid-ui" / "src"


def is_keep(path: Path) -> bool:
    posix = path.as_posix().replace("\\", "/")
    name = path.name
    if "CiteStrip" in name:
        return True
    if "/components/marketing/" in posix or "/(marketing)/" in posix:
        return True
    return False


def is_strip_artifact(path: Path) -> bool:
    name = path.name
    if not name.endswith((".tsx", ".ts")):
        return False
    if "EvidenceOrientationStrip" in name or (
        "SourcesStrip" in name and "CiteStrip" not in name
    ):
        return True
    return False


def write_preserving_newlines(path: Path, text_lf: str) -> None:
    raw = path.read_bytes()
    newline = b"\r\n" if b"\r\n" in raw else b"\n"
    path.write_bytes(text_lf.replace("\n", newline.decode("ascii")).encode("utf-8"))


def strip_imports_and_jsx(text: str) -> str:
    out = text
    out = re.sub(
        r'^import\s+\{[^}]*?(?:EvidenceOrientationStrip|SourcesStrip)[^}]*?\}\s+from\s+["\'][^"\']+["\'];\s*\n',
        "",
        out,
        flags=re.M,
    )
    out = re.sub(
        r'^import\s+[A-Za-z0-9_]+\s+from\s+["\'][^"\']*(?:EvidenceOrientationStrip|SourcesStrip)[^"\']*["\'];\s*\n',
        "",
        out,
        flags=re.M,
    )
    out = re.sub(
        r"\s*<(?:[A-Za-z0-9_]+(?:EvidenceOrientationStrip|SourcesStrip))\b[^>]*/>\s*\n?",
        "\n",
        out,
    )
    out = re.sub(
        r"\s*\{?\s*<(?:[A-Za-z0-9_]+(?:EvidenceOrientationStrip|SourcesStrip))\b[^>]*>\s*</[A-Za-z0-9_]+(?:EvidenceOrientationStrip|SourcesStrip)>\s*\}?\s*\n?",
        "\n",
        out,
    )
    out = re.sub(
        r"\s*evidenceOrientation=\{\s*<[A-Za-z0-9_]+EvidenceOrientationStrip\b[^>]*/>\s*\}\s*\n?",
        "\n",
        out,
    )
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out


def remove_inline_sources_block(text: str) -> str:
    pattern = re.compile(
        r'\n\s*<section\b[^>]*data-testid="[^"]*-sources"[^>]*>.*?</section>\s*'
        r'(?:\n\s*<aside\b[^>]*data-testid="[^"]*-claim-discipline"[^>]*>.*?</aside>\s*)?',
        re.S,
    )
    out = pattern.sub("\n", text)
    pattern2 = re.compile(
        r"\n\s*<section\b[^>]*>\s*(?:<[^>]+>\s*)*Sources for follow-up.*?</section>\s*",
        re.S,
    )
    out = pattern2.sub("\n", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out


def main() -> None:
    deleted = 0
    for path in UI_SRC.rglob("*"):
        if not path.is_file():
            continue
        if not is_strip_artifact(path):
            continue
        if is_keep(path):
            continue
        path.unlink()
        deleted += 1
    print(f"deleted_artifacts={deleted}")

    changed = 0
    for path in UI_SRC.rglob("*"):
        if not path.is_file() or path.suffix not in {".ts", ".tsx"}:
            continue
        if is_keep(path):
            continue
        posix = path.as_posix().replace("\\", "/")
        if "/components/marketing/" in posix or "/(marketing)/" in posix:
            continue

        original = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
        updated = strip_imports_and_jsx(original)
        if "Sources for follow-up" in updated and "CiteStrip" not in path.name:
            updated = remove_inline_sources_block(updated)
        if updated != original:
            write_preserving_newlines(path, updated)
            changed += 1
    print(f"consumers_updated={changed}")


if __name__ == "__main__":
    main()
