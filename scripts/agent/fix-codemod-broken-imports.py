#!/usr/bin/env python3
"""Repair codemod that inserted operator imports inside multi-line import blocks."""

from __future__ import annotations

import re
import sys
from pathlib import Path

BROKEN = re.compile(
    r"import \{\nimport \{ ([^\n]+) \} from ([^\n]+);\n",
    re.MULTILINE,
)


def fix_text(text: str) -> str:
    return BROKEN.sub(r"import { \1 } from \2;\nimport {\n", text)


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "archlucid-ui/src")
    changed = 0
    for path in sorted(root.rglob("*.ts")):
        text = path.read_text(encoding="utf-8")
        if "import {\nimport {" not in text:
            continue
        updated = fix_text(text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"Fixed {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
