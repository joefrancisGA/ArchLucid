#!/usr/bin/env python3
"""
Merge-blocking guard: public marketing accessibility page stays buyer-facing.

- Root ACCESSIBILITY.md supplies the Last reviewed date shown on `/accessibility`.
- Public statement copy lives in TypeScript (`accessibility-marketing-public-statement.ts`).
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

FORBIDDEN_PUBLIC_PATTERNS = [
    re.compile(r"playwright", re.IGNORECASE),
    re.compile(r"axe-core", re.IGNORECASE),
    re.compile(r"@axe-core/playwright", re.IGNORECASE),
    re.compile(r"npm run", re.IGNORECASE),
    re.compile(r"layout\.tsx", re.IGNORECASE),
    re.compile(r"globals\.css", re.IGNORECASE),
    re.compile(r"SidebarNav", re.IGNORECASE),
    re.compile(r"eslint-plugin-jsx-a11y", re.IGNORECASE),
    re.compile(r"live-api-accessibility", re.IGNORECASE),
    re.compile(r"PAGES_DEFERRED", re.IGNORECASE),
    re.compile(r"legacy aliases", re.IGNORECASE),
    re.compile(r"archlucid-ui/e2e", re.IGNORECASE),
]


def _norm_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    md_path = repo / "ACCESSIBILITY.md"
    if not md_path.is_file():
        print(f"assert_marketing_accessibility_in_sync: missing {md_path}", file=sys.stderr)
        return 1

    md_text = _norm_newlines(md_path.read_text(encoding="utf-8"))
    if "Last reviewed:" not in md_text:
        print("assert_marketing_accessibility_in_sync: ACCESSIBILITY.md must contain a Last reviewed line.", file=sys.stderr)
        return 1

    public_statement = (
        repo / "archlucid-ui" / "src" / "lib" / "accessibility-marketing-public-statement.ts"
    )
    public_view = (
        repo / "archlucid-ui" / "src" / "components" / "marketing" / "AccessibilityMarketingPublicView.tsx"
    )
    page = repo / "archlucid-ui" / "src" / "app" / "(marketing)" / "accessibility" / "page.tsx"

    for path in (public_statement, public_view, page):
        if not path.is_file():
            print(f"assert_marketing_accessibility_in_sync: missing {path}", file=sys.stderr)
            return 1

    combined_public = public_statement.read_text(encoding="utf-8") + public_view.read_text(encoding="utf-8")
    for pattern in FORBIDDEN_PUBLIC_PATTERNS:
        if pattern.search(combined_public):
            print(
                f"assert_marketing_accessibility_in_sync: forbidden public pattern {pattern.pattern!r} in marketing accessibility files.",
                file=sys.stderr,
            )
            return 1

    ui = repo / "archlucid-ui"
    if os.name == "nt":
        proc = subprocess.run(
            "npm exec -- tsx scripts/accessibility-marketing-dump-sections.ts",
            cwd=ui,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
            shell=True,
        )
    else:
        proc = subprocess.run(
            ["npm", "exec", "--", "tsx", "scripts/accessibility-marketing-dump-sections.ts"],
            cwd=ui,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout or "tsx dump failed", file=sys.stderr)
        return proc.returncode or 1

    raw_out = (proc.stdout or "").strip()
    dump: dict | None = None
    try:
        dump = json.loads(raw_out)
    except json.JSONDecodeError:
        for line in reversed(raw_out.splitlines()):
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                dump = json.loads(line)
                break
            except json.JSONDecodeError:
                continue

    if dump is None:
        print(f"assert_marketing_accessibility_in_sync: invalid JSON from tsx dump:\n{proc.stdout}", file=sys.stderr)
        return 1

    last_line = dump.get("lastReviewedLine")
    if not isinstance(last_line, str) or len(last_line.strip()) == 0:
        print("assert_marketing_accessibility_in_sync: TS parser did not produce lastReviewedLine.", file=sys.stderr)
        return 1

    if last_line not in md_text:
        print(
            f"assert_marketing_accessibility_in_sync: lastReviewedLine not found verbatim in ACCESSIBILITY.md: {last_line!r}",
            file=sys.stderr,
        )
        return 1

    page_text = page.read_text(encoding="utf-8")
    if "readAccessibilityPolicyMarkdown" not in page_text or "parseLastReviewedLine" not in page_text:
        print(
            "assert_marketing_accessibility_in_sync: marketing page must load Last reviewed via readAccessibilityPolicyMarkdown.",
            file=sys.stderr,
        )
        return 1

    if "accessibility-marketing-public-statement" not in public_view.read_text(encoding="utf-8"):
        print(
            "assert_marketing_accessibility_in_sync: public view must import accessibility-marketing-public-statement.",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
