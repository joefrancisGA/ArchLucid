#!/usr/bin/env python3
"""Fail when SecureNow UI rate PNGs are identical skeleton captures (invalid for /al-ui-rate)."""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SHOT_DIR = REPO / "archlucid-ui" / "public" / "screenshots" / "securenow-ui-rate"
MIN_BYTES = 12_000
MIN_UNIQUE_HASHES = 8


def main() -> int:
    if not SHOT_DIR.is_dir():
        print(f"Missing screenshot dir: {SHOT_DIR}", file=sys.stderr)
        return 1

    pngs = sorted(SHOT_DIR.glob("*.png"))

    if not pngs:
        print(f"No PNGs under {SHOT_DIR}", file=sys.stderr)
        return 1

    by_hash: dict[str, list[Path]] = {}
    small: list[Path] = []

    for png in pngs:
        data = png.read_bytes()
        if len(data) < MIN_BYTES:
            small.append(png)

        digest = hashlib.md5(data).hexdigest()
        by_hash.setdefault(digest, []).append(png)

    home_path = SHOT_DIR / "home.png"
    if home_path.is_file():
        home_hash = hashlib.md5(home_path.read_bytes()).hexdigest()
        home_collisions = [
            path.name
            for path in by_hash.get(home_hash, [])
            if path.name != home_path.name
        ]

        if home_collisions:
            print(
                "FAIL: non-home route capture(s) are byte-identical to home.png:",
                file=sys.stderr,
            )
            for name in home_collisions:
                print(f"  {name}", file=sys.stderr)

            return 1

    if small:
        print(f"FAIL: {len(small)} PNG(s) under {MIN_BYTES} bytes (skeleton-sized):", file=sys.stderr)
        for path in small[:10]:
            print(f"  {path.name}", file=sys.stderr)

        return 1

    unique = len(by_hash)

    if unique < MIN_UNIQUE_HASHES:
        print(
            f"FAIL: only {unique} unique PNG hash(es) across {len(pngs)} files "
            f"(need at least {MIN_UNIQUE_HASHES}). Duplicate clusters:",
            file=sys.stderr,
        )
        for digest, members in sorted(by_hash.items(), key=lambda item: (-len(item[1]), item[0])):
            if len(members) > 1:
                print(f"  {digest}: {', '.join(path.name for path in members)}", file=sys.stderr)

        return 1

    print(f"OK: {len(pngs)} PNGs, {unique} unique hashes, all >= {MIN_BYTES} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
