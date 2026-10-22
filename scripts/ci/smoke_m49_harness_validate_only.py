#!/usr/bin/env python3
"""CI smoke for M-49 harness validate-only scaffold generation."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "validation"))

from m49_faithfulness_scaffold import write_scaffold  # noqa: E402


def main() -> int:
    ps1 = ROOT / "scripts" / "validation" / "run-real-mode-faithfulness.ps1"
    text = ps1.read_text(encoding="utf-8")

    if "ValidateOnly" not in text:
        print("run-real-mode-faithfulness.ps1 missing ValidateOnly switch.", file=sys.stderr)
        return 1

    placeholder_ids = [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
        "33333333-3333-3333-3333-333333333333",
    ]

    with tempfile.TemporaryDirectory() as tmp:
        output_dir = Path(tmp)
        result = write_scaffold(output_dir, placeholder_ids)
        rollup = Path(str(result["rollupPath"]))
        manifest = Path(str(result["manifestPath"]))

        if not rollup.is_file() or not manifest.is_file():
            print("M-49 validate-only smoke failed: expected rollup and manifest files.", file=sys.stderr)
            return 1

        rollup_text = rollup.read_text(encoding="utf-8")
        if "Cohort rollup" not in rollup_text or placeholder_ids[0] not in rollup_text:
            print("M-49 validate-only smoke failed: rollup content unexpected.", file=sys.stderr)
            return 1

    print("M-49 validate-only smoke OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
