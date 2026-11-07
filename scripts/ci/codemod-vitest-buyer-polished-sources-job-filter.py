#!/usr/bin/env python3
"""Wrap buyer-polished Sources loops with filterOrientationSourcesForJobContext when missing."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "archlucid-ui" / "src"

PATH_BY_SOURCES: dict[str, str] = {
    "FIRST_REVIEW_GUIDE_SOURCES": "FIRST_REVIEW_GUIDE_PATH",
    "SLACK_INTEGRATION_SOURCES": "SLACK_INTEGRATION_CANONICAL_PATH",
}

IMPORT_FILTER = (
    'import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";\n'
)

LOOP_PATTERN = re.compile(
    r"for \(const source of filterWhereToGoNextFollowUpLinks\(([A-Z][A-Z0-9_]+)\)\)",
    re.MULTILINE,
)

PATHNAME_MOCK_RE = re.compile(r'usePathname:\s*\(\)\s*=>\s*"([^"]+)"')


def pathname_from_mock(text: str) -> str | None:
    match = PATHNAME_MOCK_RE.search(text)
    if match is None:
        return None
    return f'"{match.group(1)}"'


def resolve_path_arg(text: str, sources_var: str) -> str | None:
    if sources_var in PATH_BY_SOURCES:
        return PATH_BY_SOURCES[sources_var]
    from_mock = pathname_from_mock(text)
    if from_mock is not None:
        return from_mock
    return None


def ensure_filter_import(text: str) -> str:
    if IMPORT_FILTER.strip() in text:
        return text
    anchor = 'import { filterWhereToGoNextFollowUpLinks }'
    idx = text.find(anchor)
    if idx < 0:
        return text
    return text[:idx] + IMPORT_FILTER + text[idx:]


def patch_file(path: Path, text: str) -> str | None:
    if "expectedSources = filterOrientationSourcesForJobContext" in text:
        return None
    m = LOOP_PATTERN.search(text)
    if m is None:
        return None
    sources_var = m.group(1)
    path_arg = resolve_path_arg(text, sources_var)
    if path_arg is None:
        return None

    text = ensure_filter_import(text)

    if sources_var == "FIRST_REVIEW_GUIDE_SOURCES" and "FIRST_REVIEW_GUIDE_PATH" not in text:
        anchor = 'import { filterWhereToGoNextFollowUpLinks }'
        idx = text.find(anchor)
        text = (
            text[:idx]
            + 'import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";\n'
            + text[idx:]
        )
    if sources_var == "SLACK_INTEGRATION_SOURCES" and "SLACK_INTEGRATION_CANONICAL_PATH" not in text:
        text = text.replace(
            "SLACK_INTEGRATION_SOURCES,\n} from \"@/lib/slack-integration-evidence-copy\";",
            "SLACK_INTEGRATION_SOURCES,\n  SLACK_INTEGRATION_CANONICAL_PATH,\n} from \"@/lib/slack-integration-evidence-copy\";",
        )

    old_loop = m.group(0)
    new_loop = f"""const expectedSources = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks({sources_var}),
      {path_arg},
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
