#!/usr/bin/env python3
"""
Merge-blocking guard: public marketing accessibility content must stay aligned with root ACCESSIBILITY.md.

The canonical Markdown parser lives in TypeScript (`archlucid-ui/src/lib/accessibility-marketing-policy.ts`).
This script re-parses the Markdown with the same `## heading` rules and asserts bodies match the `tsx` dump byte-for-byte.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path


REQUIRED_SECTION_TITLES = [
    "Target compliance level",
    "Current status",
    "Tooling",
    "Existing accessibility controls",
    "Known exemptions",
    "Review cadence",
]


def _norm_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def split_markdown_sections(text: str) -> dict[str, str]:
    pattern = re.compile(r"^## (.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    out: dict[str, str] = {}
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        out[title] = text[start:end].strip()
    return out


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

    if "## Review cadence" not in md_text:
        print("assert_marketing_accessibility_in_sync: ACCESSIBILITY.md must contain ## Review cadence.", file=sys.stderr)
        return 1

    if "/accessibility" not in md_text and "accessibility/page.tsx" not in md_text:
        print(
            "assert_marketing_accessibility_in_sync: ACCESSIBILITY.md must cross-link the marketing /accessibility surface.",
            file=sys.stderr,
        )
        return 1

    ui = repo / "archlucid-ui"
    # Use `npm exec` (not bare `npx`) so subprocess can resolve `npm` / `npm.cmd` on Windows.
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

    py_sections = split_markdown_sections(md_text)
    dump_sections = dump.get("sections")
    if not isinstance(dump_sections, dict):
        print("assert_marketing_accessibility_in_sync: dump.sections must be an object.", file=sys.stderr)
        return 1

    for title in REQUIRED_SECTION_TITLES:
        py_body = py_sections.get(title)
        ts_body = dump_sections.get(title)
        if py_body is None:
            print(f"assert_marketing_accessibility_in_sync: missing ## {title} in ACCESSIBILITY.md", file=sys.stderr)
            return 1
        if not isinstance(ts_body, str):
            print(f"assert_marketing_accessibility_in_sync: dump missing string body for {title!r}", file=sys.stderr)
            return 1
        if _norm_newlines(py_body) != _norm_newlines(ts_body):
            print(
                f"assert_marketing_accessibility_in_sync: section body mismatch for ## {title} "
                f"(Python split != TS parser). Re-run archlucid-ui/scripts/accessibility-marketing-dump-sections.ts locally.",
                file=sys.stderr,
            )
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

    page = repo / "archlucid-ui" / "src" / "app" / "(marketing)" / "accessibility" / "page.tsx"
    if not page.is_file():
        print(f"assert_marketing_accessibility_in_sync: missing marketing page {page}", file=sys.stderr)
        return 1

    page_text = page.read_text(encoding="utf-8")
    if "readAccessibilityPolicyMarkdown" not in page_text or "requireAccessibilityMarketingSections" not in page_text:
        print("assert_marketing_accessibility_in_sync: marketing page must load policy via readAccessibilityPolicyMarkdown.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
