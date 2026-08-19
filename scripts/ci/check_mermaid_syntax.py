#!/usr/bin/env python3
"""
Optionally validate ```mermaid fenced blocks using mermaid-cli (mmdc).

When ``mmdc`` is not on PATH, exits 0 after printing a skip notice (CI-friendly).
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


MERMAID_BLOCK = re.compile(r"```mermaid\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def extract_blocks(md_path: Path) -> list[str]:
    text = md_path.read_text(encoding="utf-8", errors="replace")
    return [m.group(1).strip() + "\n" for m in MERMAID_BLOCK.finditer(text)]


def validate_block(source: str, work: Path) -> tuple[bool, str]:
    in_path = work / "diagram.mmd"
    out_path = work / "diagram.svg"
    in_path.write_text(source, encoding="utf-8")
    result = subprocess.run(
        ["mmdc", "-i", str(in_path), "-o", str(out_path), "-b", "transparent"],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        err = (result.stderr or result.stdout or "").strip()
        return False, err or "mmdc exited non-zero"

    return True, ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Markdown files containing mermaid fences (default: architecture poster).",
    )
    args = parser.parse_args()
    mmdc = shutil.which("mmdc")

    if mmdc is None:
        print("check_mermaid_syntax: SKIP (mmdc not on PATH)")
        return 0

    root = repo_root()
    paths_arg: list[Path] = list(args.paths)

    if len(paths_arg) == 0:
        paths_arg = [root / "docs" / "ARCHITECTURE_ON_ONE_PAGE.md"]

    failures: list[str] = []

    for raw in paths_arg:
        md = raw if raw.is_absolute() else root / raw

        if not md.is_file():
            failures.append(f"{md}: not a file")
            continue

        blocks = extract_blocks(md)

        for i, block in enumerate(blocks):
            with tempfile.TemporaryDirectory() as tmpdir:
                work = Path(tmpdir)
                ok, msg = validate_block(block, work)

                if not ok:
                    failures.append(f"{md}: block {i + 1}: {msg}")

    if failures:
        print("check_mermaid_syntax: FAILED", file=sys.stderr)

        for line in failures[:50]:
            print(line, file=sys.stderr)

        if len(failures) > 50:
            print(f"... and {len(failures) - 50} more", file=sys.stderr)

        return 1

    block_total = 0

    for raw in paths_arg:
        md = raw if raw.is_absolute() else root / raw

        if md.is_file():
            block_total += len(extract_blocks(md))

    print(f"check_mermaid_syntax: OK ({block_total} block(s) via mmdc)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
