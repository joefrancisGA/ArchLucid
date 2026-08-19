#!/usr/bin/env python3
"""Patch ci.yml: PR fast-core filter env var; remove duplicate finding-engine step from corset."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    path = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "ci.yml"
    text = path.read_text(encoding="utf-8")
    old = (
        'run: dotnet test ArchLucid.sln --no-build -c Release --filter '
        '"Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord"'
    )
    new = 'run: dotnet test ArchLucid.sln --no-build -c Release --filter "${{ env.DOTNET_FAST_CORE_TEST_FILTER }}"'
    if old in text:
        text = text.replace(old, new, 1)

    corset_start = text.find("  dotnet-fast-core:")
    artifacts_start = text.find("  dotnet-fast-core-artifacts:", corset_start)
    if corset_start < 0 or artifacts_start < 0:
        raise ValueError("job markers not found")

    segment = text[corset_start:artifacts_start]
    needle = "finding-engine template (not in main solution)"
    if needle in segment:
        step_start = segment.rfind("      - name:", 0, segment.find(needle))
        text = text[: corset_start + step_start] + text[artifacts_start:]

    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"Patched {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
