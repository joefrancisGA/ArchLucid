#!/usr/bin/env python3
"""Run assert-score-lift-round65 through round77 in order (CI umbrella)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SCRIPTS = [f"scripts/ci/assert-score-lift-round{n}-batch.py" for n in range(65, 78)]


def main() -> int:
    for relative in SCRIPTS:
        path = REPO_ROOT / relative
        if not path.is_file():
            print(f"Missing score-lift assert script: {relative}", file=sys.stderr)
            return 1

        completed = subprocess.run([sys.executable, str(path)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift rounds 65–77 umbrella passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


