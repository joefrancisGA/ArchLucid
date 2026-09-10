#!/usr/bin/env python3
"""Summarize private-beta Playwright failure triage steps for CI artifacts.

Used when `private-beta-access-on-push.yml`, `private-beta-access-smoke-branch.yml`,
or `ui-e2e-live-beta-access` fails.
See docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md for the full operator runbook.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RUNBOOK = REPO_ROOT / "docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md"
FROZEN_RUNBOOK = REPO_ROOT / "docs/runbooks/PRIVATE_BETA_FROZEN_BRANCH.md"
SPEC_ORDER = [
    "archlucid-ui/e2e/live-api-scim-invite-substitute-smoke.spec.ts",
    "archlucid-ui/e2e/live-api-invite-flow.spec.ts",
    "archlucid-ui/e2e/live-api-private-beta-wave-3.spec.ts",
    "archlucid-ui/e2e/live-api-private-beta-access.spec.ts",
]
HEAVY_SPEC = SPEC_ORDER[-1]

LANE_ARTIFACT_PREFIX: dict[str, str] = {
    "trunk": "ui-e2e-live-beta-access-on-push",
    "smoke-branch": "ui-e2e-live-beta-access-smoke-branch",
    "full-matrix": "ui-e2e-live-beta-access",
}


def artifact_name(lane: str, suffix: str) -> str:
    prefix = LANE_ARTIFACT_PREFIX.get(lane, LANE_ARTIFACT_PREFIX["trunk"])
    return f"{prefix}-{suffix}"


def build_triage_steps(lane: str) -> list[dict[str, str]]:
    cancel_hint = (
        "Frozen/smoke-branch lane uses cancel-in-progress: false; trunk push may cancel older SHAs."
        if lane == "smoke-branch"
        else "Ignore superseded runs when branch concurrency cancelled an older SHA."
    )

    return [
        {
            "stepId": "confirm-playwright-started",
            "title": "Confirm Playwright step started (not queue-cancelled)",
            "artifact": "job log",
            "hint": cancel_hint,
        },
        {
            "stepId": "playwright-spec-order",
            "title": "Note Playwright spec order (lighter specs first)",
            "artifact": "job log (npx playwright test …)",
            "hint": " → ".join([Path(p).name for p in SPEC_ORDER]),
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
            "artifact": artifact_name(lane, "api-log"),
            "hint": "SQL timeouts, JwtBearer auth faults, Simulator pipeline errors.",
        },
        {
            "stepId": "playwright-report",
            "title": "Open HTML trace summary",
            "artifact": artifact_name(lane, "playwright-report"),
            "hint": f"Proxy/JWT mismatch, draft stub ordering, create-run timeouts in {Path(HEAVY_SPEC).name}.",
        },
        {
            "stepId": "test-results",
            "title": "Per-test screenshots and traces",
            "artifact": artifact_name(lane, "test-results"),
            "hint": "Signed-out deep-link, session-expired recovery, invitee TB-927 journeys.",
        },
        {
            "stepId": "blob-report",
            "title": "Blob report for merge (optional)",
            "artifact": artifact_name(lane, "blob-report"),
            "hint": "Use when comparing shards or re-running merge locally.",
        },
        {
            "stepId": "failure-triage-rollup",
            "title": "Open machine-readable triage rollup",
            "artifact": artifact_name(lane, "failure-triage"),
            "hint": "This artifact; fetch via scripts/ci/fetch_private_beta_smoke_artifacts.sh when gh is available.",
        },
    ]


def build_summary(root: Path, lane: str = "trunk") -> dict[str, object]:
    runbook_exists = (root / RUNBOOK.relative_to(root)).is_file()
    heavy_spec_path = root / HEAVY_SPEC
    heavy_spec_exists = heavy_spec_path.is_file()
    steps = build_triage_steps(lane)

    overall = "PASS" if runbook_exists and heavy_spec_exists else "INCONCLUSIVE"

    frozen_runbook_path = None

    if (root / FROZEN_RUNBOOK.relative_to(root)).is_file():
        frozen_runbook_path = str(FROZEN_RUNBOOK.relative_to(root))

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "overallDisposition": overall,
        "lane": lane,
        "runbookPath": str(RUNBOOK.relative_to(root)),
        "frozenRunbookPath": frozen_runbook_path,
        "specOrder": SPEC_ORDER,
        "heavySpecPath": HEAVY_SPEC,
        "stepCount": len(steps),
        "steps": steps,
    }


def render_markdown(summary: dict[str, object]) -> str:
    spec_order = summary.get("specOrder", [])
    spec_order_line = ""

    if isinstance(spec_order, list) and spec_order:
        spec_order_line = " → ".join(Path(str(p)).name for p in spec_order)

    lines = [
        "# Private-beta Playwright failure triage rollup",
        "",
        f"**Overall disposition:** {summary.get('overallDisposition')}",
        f"**Lane:** `{summary.get('lane', 'trunk')}`",
        "",
        f"**Heavy spec (create-run):** `{summary.get('heavySpecPath')}`",
        "",
        f"**Playwright order:** `{spec_order_line}`",
        "",
        f"**Runbook:** `{summary.get('runbookPath')}`",
    ]

    frozen_path = summary.get("frozenRunbookPath")

    if frozen_path:
        lines.append(f"**Frozen lane runbook:** `{frozen_path}`")

    lines.extend(
        [
            "",
            "| Order | Step | Artifact | Hint |",
            "| ---: | --- | --- | --- |",
        ]
    )

    for index, row in enumerate(summary.get("steps", []), start=1):
        if not isinstance(row, dict):
            continue

        lines.append(
            f"| {index} | {row.get('title')} | `{row.get('artifact')}` | {row.get('hint')} |"
        )

    lines.append("")
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--lane",
        choices=sorted(LANE_ARTIFACT_PREFIX.keys()),
        default="trunk",
        help="CI workflow lane (controls artifact name prefix in the rollup).",
    )
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, default=None)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    summary = build_summary(REPO_ROOT, lane=args.lane)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Private-beta Playwright failure triage rollup: {summary.get('overallDisposition')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
