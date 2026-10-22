#!/usr/bin/env python3
"""
Validate architecture diagram + handbook packaging drift.

Checks:
  - each docs/architecture/architecture_diagrams/*.mmd has sibling .svg and .png
  - handbook Markdown image refs to architecture_diagrams resolve
  - site/index.html exists
  - DIAGRAM_ADR_OVERLAY.md and C4_MERMAID_SYNC.md exist
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


IMG_REF = re.compile(
    r"!\[[^\]]*\]\(([^)]+architecture_diagrams/[^)]+)\)",
    re.IGNORECASE,
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    diagrams = root / "docs" / "architecture" / "architecture_diagrams"
    handbook = root / "docs" / "architecture" / "architecture_handbook"
    arch = root / "docs" / "architecture"
    failures: list[str] = []

    if not diagrams.is_dir():
        print(f"FAIL: missing diagrams dir {diagrams}")
        return 1

    mmds = sorted(diagrams.glob("*.mmd"))

    if len(mmds) == 0:
        failures.append(f"no .mmd files under {diagrams}")

    for mmd in mmds:
        stem = mmd.stem
        svg = diagrams / f"{stem}.svg"
        png = diagrams / f"{stem}.png"

        if not svg.is_file():
            failures.append(f"missing SVG for {mmd.name}: {svg.relative_to(root)}")

        if not png.is_file():
            failures.append(f"missing PNG for {mmd.name}: {png.relative_to(root)}")

    site_index = handbook / "site" / "index.html"

    if not site_index.is_file():
        failures.append(f"missing site index: {site_index.relative_to(root)}")

    for name in ("DIAGRAM_ADR_OVERLAY.md", "C4_MERMAID_SYNC.md"):
        path = arch / name

        if not path.is_file():
            failures.append(f"missing meta doc: {path.relative_to(root)}")

    md_roots = [handbook]

    if handbook.is_dir():
        md_files = list(handbook.rglob("*.md"))
    else:
        md_files = []
        failures.append(f"missing handbook dir {handbook}")

    for md in md_files:
        if md.name.endswith(".generated.md"):
            continue

        text = md.read_text(encoding="utf-8", errors="replace")

        for match in IMG_REF.finditer(text):
            rel = match.group(1).strip()

            # Strip optional title / whitespace
            if " " in rel:
                rel = rel.split(" ", 1)[0]

            candidate = (md.parent / rel).resolve()

            if not candidate.is_file():
                failures.append(
                    f"broken image ref in {md.relative_to(root)}: {rel}"
                )

    if failures:
        print("check_architecture_diagrams_drift: FAIL")

        for item in failures:
            print(f"  - {item}")

        return 1

    print(
        "check_architecture_diagrams_drift: OK "
        f"({len(mmds)} mmd; handbook refs + meta docs)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
