#!/usr/bin/env python3
"""Generate maintainability boundary map markdown (assessment improvement #22)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE = REPO_ROOT / "scripts/ci/fixtures/maintainability_boundary_map.json"
OUTPUT = REPO_ROOT / "docs/library/MAINTAINABILITY_BOUNDARY_MAP.generated.md"


def load_rows(path: Path) -> list[dict[str, object]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("changeTypes")

    if not isinstance(rows, list) or len(rows) == 0:
        raise ValueError(f"{path} must contain a non-empty changeTypes array")

    return rows


def render_markdown(rows: list[dict[str, object]]) -> str:
    lines = [
        "> **Scope:** Generated maintainability boundary map — do not edit by hand.",
        "",
        "# Maintainability boundary map (generated)",
        "",
        "| Change type | Touch | Primary tests/docs |",
        "| --- | --- | --- |",
    ]

    for row in rows:
        change_type = str(row.get("changeType", ""))
        touch = ", ".join(str(item) for item in row.get("touchPaths", []))
        tests = ", ".join(str(item) for item in row.get("testsAndDocs", []))
        lines.append(f"| {change_type} | `{touch}` | {tests} |")

    lines.extend(
        [
            "",
            "Regenerate:",
            "",
            "```bash",
            "python scripts/ci/generate_maintainability_boundary_map.py",
            "```",
            "",
        ]
    )

    return "\n".join(lines)


def missing_paths(root: Path, rows: list[dict[str, object]]) -> list[str]:
    missing: list[str] = []

    for row in rows:
        for key in ("touchPaths", "testsAndDocs"):
            for rel in row.get(key, []):
                if not isinstance(rel, str):
                    continue

                path = root / rel

                if not path.exists():
                    missing.append(rel)

    return missing


def main() -> int:
    rows = load_rows(FIXTURE)
    missing = missing_paths(REPO_ROOT, rows)

    if missing:
        print("Maintainability boundary map FAILED:", file=sys.stderr)

        for item in missing:
            print(f"  - missing path: {item}", file=sys.stderr)

        return 1

    OUTPUT.write_text(render_markdown(rows), encoding="utf-8")
    print(f"Maintainability boundary map: OK -> {OUTPUT.relative_to(REPO_ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
