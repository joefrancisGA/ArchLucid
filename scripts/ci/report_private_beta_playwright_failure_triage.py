#!/usr/bin/env python3
"""Summarize private-beta Playwright failure triage steps for CI artifacts.

Used when `private-beta-access-on-push.yml` or `ui-e2e-live-beta-access` fails.
See docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md for the full operator runbook.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RUNBOOK = REPO_ROOT / "docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md"
SPEC = "archlucid-ui/e2e/live-api-private-beta-access.spec.ts"

TRIAGE_STEPS: list[dict[str, str]] = [
    {
        "stepId": "confirm-playwright-started",
        "title": "Confirm Playwright step started (not queue-cancelled)",
        "artifact": "job log",
        "hint": "Ignore superseded runs when branch concurrency cancelled an older SHA.",
    },
    {
        "stepId": "health-ready-poll",
        "title": "Check post-warm /health/ready poll lines",
        "artifact": "job log",
        "hint": "Look for HTTP status codes from scripts/ci/wait-for-api-ready.sh (503 recovery).",
    },
    {
        "stepId": "api-log",
        "title": "Inspect API stderr during create-run warm / Playwright",
        "artifact": "ui-e2e-live-beta-access-on-push-api-log",
        "hint": "SQL timeouts, JwtBearer auth faults, Simulator pipeline errors.",
    },
    {
        "stepId": "playwright-report",
        "title": "Open HTML trace summary",
        "artifact": "ui-e2e-live-beta-access-on-push-playwright-report",
        "hint": "Proxy/JWT mismatch, draft stub ordering, reviews hub row lag.",
    },
    {
        "stepId": "test-results",
        "title": "Per-test screenshots and traces",
        "artifact": "ui-e2e-live-beta-access-on-push-test-results",
        "hint": "Signed-out deep-link, session-expired recovery, identity desk smoke.",
    },
    {
        "stepId": "blob-report",
        "title": "Blob report for merge (optional)",
        "artifact": "ui-e2e-live-beta-access-on-push-blob-report",
        "hint": "Use when comparing shards or re-running merge locally.",
    },
]


def build_summary(root: Path) -> dict[str, object]:
    runbook_exists = (root / RUNBOOK.relative_to(root)).is_file()
    spec_exists = (root / SPEC).is_file()

    overall = "PASS" if runbook_exists and spec_exists else "INCONCLUSIVE"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "overallDisposition": overall,
        "runbookPath": str(RUNBOOK.relative_to(root)),
        "specPath": SPEC,
        "stepCount": len(TRIAGE_STEPS),
        "steps": TRIAGE_STEPS,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Private-beta Playwright failure triage rollup",
        "",
        f"**Overall disposition:** {summary.get('overallDisposition')}",
        "",
        f"**Spec:** `{summary.get('specPath')}`",
        "",
        f"**Runbook:** `{summary.get('runbookPath')}`",
        "",
        "| Order | Step | Artifact | Hint |",
        "| ---: | --- | --- | --- |",
    ]

    for index, row in enumerate(summary.get("steps", []), start=1):
        if not isinstance(row, dict):
            continue

        lines.append(
            f"| {index} | {row.get('title')} | `{row.get('artifact')}` | {row.get('hint')} |"
        )

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    markdown_out: Path | None = None
    json_out: Path | None = None
    args = sys.argv[1:]
    index = 0

    while index < len(args):
        token = args[index]

        if token == "--markdown-out" and index + 1 < len(args):
            markdown_out = Path(args[index + 1])
            index += 2
            continue

        if token == "--json-out" and index + 1 < len(args):
            json_out = Path(args[index + 1])
            index += 2
            continue

        print(f"Unknown argument: {token}", file=sys.stderr)
        return 2

    summary = build_summary(REPO_ROOT)

    if json_out is not None:
        json_out.parent.mkdir(parents=True, exist_ok=True)
        json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if markdown_out is not None:
        markdown_out.parent.mkdir(parents=True, exist_ok=True)
        markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Private-beta Playwright failure triage rollup: {summary.get('overallDisposition')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
