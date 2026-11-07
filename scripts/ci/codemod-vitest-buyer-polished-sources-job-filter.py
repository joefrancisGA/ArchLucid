#!/usr/bin/env python3
"""Wrap buyer-polished Sources loops with filterOrientationSourcesForJobContext when missing."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "archlucid-ui" / "src"

PATH_BY_SOURCES = {
    "FIRST_REVIEW_GUIDE_SOURCES": "FIRST_REVIEW_GUIDE_PATH",
    "SLACK_INTEGRATION_SOURCES": "SLACK_INTEGRATION_CANONICAL_PATH",
    "ASK_REVIEW_QUESTIONS_PATH": "ASK_REVIEW_QUESTIONS_PATH",  # special case below
}

IMPORT_FILTER = 'import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";\n'

LOOP_PATTERN = re.compile(
    r"for \(const source of filterWhereToGoNextFollowUpLinks\(([A-Z][A-Z0-9_]+)\)\)",
    re.MULTILINE,
)


def patch_file(path: Path, text: str) -> str | None:
    if "filterOrientationSourcesForJobContext" in text:
        return None
    m = LOOP_PATTERN.search(text)
    if m is None:
        return None
    sources_var = m.group(1)
    path_var = PATH_BY_SOURCES.get(sources_var)
    if path_var is None:
        if sources_var.endswith("_SOURCES"):
            # heuristic: FOO_SOURCES -> FOO_CANONICAL_PATH or import from same module
            return None
        return None
    if IMPORT_FILTER.strip() not in text:
        anchor = 'import { filterWhereToGoNextFollowUpLinks }'
        idx = text.find(anchor)
        if idx < 0:
            return None
        text = text[:idx] + IMPORT_FILTER + text[idx:]
    if path_var not in text and sources_var == "SLACK_INTEGRATION_SOURCES":
        anchor = f"}} from \"@/lib/slack-integration-evidence-copy\";"
        if anchor in text:
            text = text.replace(
                anchor,
                f",\n  {path_var},\n}} from \"@/lib/slack-integration-evidence-copy\";",
                1,
            )
    if path_var not in text and sources_var == "FIRST_REVIEW_GUIDE_SOURCES":
        if 'from "@/lib/first-review-guide-route"' not in text:
            anchor = 'import { filterWhereToGoNextFollowUpLinks }'
            idx = text.find(anchor)
            text = (
                text[:idx]
                + f'import {{ {path_var} }} from "@/lib/first-review-guide-route";\n'
                + text[idx:]
            )

    old_loop = m.group(0)
    new_loop = f"""const expectedSources = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks({sources_var}),
      {path_var},
    );

    for (const source of expectedSources)"""
    return text.replace(old_loop, new_loop, 1)


def main() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*buyer-polished*.test.tsx")):
        text = path.read_text(encoding="utf-8")
        updated = patch_file(path, text)
        if updated is None:
            continue
        path.write_text(updated, encoding="utf-8")
        changed += 1
        print(path.relative_to(ROOT.parent))
    print(f"Patched {changed} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
