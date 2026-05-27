#!/usr/bin/env python3
"""Fail when ArchLucid_Unified_Schema.sql drifts from generator output."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GENERATOR = ROOT / "scripts" / "ci" / "build_archlucid_unified_schema_sql.py"
SNAPSHOT = ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid_Unified_Schema.sql"


def main() -> int:
    if not GENERATOR.is_file():
        print(f"Missing generator: {GENERATOR}", file=sys.stderr)
        return 2

    if not SNAPSHOT.is_file():
        print(f"Missing snapshot: {SNAPSHOT}", file=sys.stderr)
        return 2

    with tempfile.TemporaryDirectory() as tmp:
        generated = Path(tmp) / "ArchLucid_Unified_Schema.sql"
        env = dict(**{k: v for k, v in __import__("os").environ.items()})
        # Generator writes to repo path; copy master output by running generator then diffing in-memory alternative:
        # Run generator (updates SNAPSHOT in repo) is wrong — patch generator to accept OUT or diff via subprocess + import.

        spec_mod = __import__("importlib.util").util.spec_from_file_location("build_unified", GENERATOR)
        if spec_mod is None or spec_mod.loader is None:
            print("Cannot load generator module.", file=sys.stderr)
            return 2

        mod = __import__("importlib.util").util.module_from_spec(spec_mod)
        spec_mod.loader.exec_module(mod)

        master_text = (ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid.sql").read_text(encoding="utf-8")
        batches = mod.split_go_batches(master_text)
        kept = [b for b in batches if mod.batch_has_declarative_ddl(b)]
        generated.write_text(mod.HEADER + "\n\nGO\n\n".join(kept) + "\n", encoding="utf-8")

        expected = SNAPSHOT.read_text(encoding="utf-8")

        if expected == generated.read_text(encoding="utf-8"):
            print("ArchLucid_Unified_Schema.sql matches generator output.")
            return 0

        diff = subprocess.run(
            ["git", "diff", "--no-index", "--", str(SNAPSHOT), str(generated)],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

        print(
            "ArchLucid_Unified_Schema.sql is stale. Regenerate with:\n"
            "  python scripts/ci/build_archlucid_unified_schema_sql.py",
            file=sys.stderr,
        )

        if diff.stdout:
            print(diff.stdout, file=sys.stderr)

        return 1


if __name__ == "__main__":
    raise SystemExit(main())
