#!/usr/bin/env python3
"""Generate docs/library/POLICY_PACK_DRY_RUN_INDEX.md from packManifest rows (TB-176)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_SCRIPTS_CI = Path(__file__).resolve().parent

if str(_SCRIPTS_CI) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_CI))

from policy_pack_manifest_lib import collect_manifest_rows, render_dry_run_index_markdown


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def default_index_path(root: Path) -> Path:
    return root / "docs" / "library" / "POLICY_PACK_DRY_RUN_INDEX.md"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write generated markdown to docs/library/POLICY_PACK_DRY_RUN_INDEX.md",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if committed index differs from generated content",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    rows = collect_manifest_rows(root)

    if not rows:
        print("ERROR: no packManifest rows found under templates/policy-packs", file=sys.stderr)
        return 2

    generated = render_dry_run_index_markdown(rows) + "\n"
    index_path = default_index_path(root)

    if args.write:
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text(generated, encoding="utf-8", newline="\n")
        print(f"Wrote {index_path.relative_to(root)} ({len(rows)} packs)")
        return 0

    if args.check:
        if not index_path.is_file():
            print(f"ERROR: missing {index_path}", file=sys.stderr)
            return 2

        committed = index_path.read_text(encoding="utf-8").replace("\r\n", "\n")

        if committed != generated:
            print("ERROR: POLICY_PACK_DRY_RUN_INDEX.md is stale; run with --write", file=sys.stderr)
            return 1

        print(f"OK: index matches packManifest ({len(rows)} packs)")
        return 0

    print(generated, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
