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


def classify_warmup_log(log_text: str) -> dict[str, object]:
    """Classify optional warmup 400s separately from API startup failures."""
    normalized = log_text.lower()
    optional_http_400 = "warm create architecture run" in normalized and "http 400" in normalized
    api_failed = "api process exited" in normalized or "now listening" not in normalized

    if optional_http_400 and not api_failed:
        return {
            "status": "EXPECTED_OPTIONAL_HTTP_400",
            "detail": "Optional create-run warmup returned HTTP 400; Playwright JIT warmup remains authoritative.",
        }

    if optional_http_400:
        return {
            "status": "OPTIONAL_HTTP_400_WITH_STARTUP_SIGNAL",
            "detail": "Warmup returned HTTP 400 while startup diagnostics require review.",
        }

    return {
        "status": "NO_OPTIONAL_HTTP_400",
        "detail": "No optional create-run HTTP 400 was found in the supplied API log.",
    }


def classify_retry_reliability(log_text: str) -> dict[str, str]:
    """Make retry-only success/failure visible instead of treating it as clean."""
    normalized = log_text.lower()
    retry_observed = "retry1" in normalized or "retrying" in normalized
    failed = "failed" in normalized or "error:" in normalized

    if retry_observed and failed:
        return {
            "status": "RETRY_RELIABILITY_REVIEW",
            "detail": "A retry and failure marker were observed; do not claim clean reliability.",
        }

    if retry_observed:
        return {
            "status": "RETRY_OBSERVED",
            "detail": "A retry marker was observed; retain it as a flake signal.",
        }

    return {
        "status": "NO_RETRY_MARKER",
        "detail": "No retry marker was found in the supplied log.",
    }


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


def build_summary(
    root: Path,
    lane: str = "trunk",
    api_log_path: Path | None = None,
    playwright_log_path: Path | None = None,
) -> dict[str, object]:
    runbook_exists = (root / RUNBOOK.relative_to(root)).is_file()
    heavy_spec_path = root / HEAVY_SPEC
    heavy_spec_exists = heavy_spec_path.is_file()
    steps = build_triage_steps(lane)

    overall = "PASS" if runbook_exists and heavy_spec_exists else "INCONCLUSIVE"

    frozen_runbook_path = None

    if (root / FROZEN_RUNBOOK.relative_to(root)).is_file():
        frozen_runbook_path = str(FROZEN_RUNBOOK.relative_to(root))

    summary: dict[str, object] = {
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

    if api_log_path is not None and api_log_path.is_file():
        summary["warmupClassification"] = classify_warmup_log(
            api_log_path.read_text(encoding="utf-8", errors="replace"),
        )

    if playwright_log_path is not None and playwright_log_path.is_file():
        summary["retryReliability"] = classify_retry_reliability(
            playwright_log_path.read_text(encoding="utf-8", errors="replace"),
        )

    return summary


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

    for classification_key, label in (
        ("warmupClassification", "Warmup classification"),
        ("retryReliability", "Retry reliability"),
    ):
        classification = summary.get(classification_key)

        if isinstance(classification, dict):
            lines.append(
                f"**{label}:** `{classification.get('status')}` — {classification.get('detail')}",
            )

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
    parser.add_argument("--api-log", type=Path, default=None)
    parser.add_argument("--playwright-log", type=Path, default=None)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    summary = build_summary(
        REPO_ROOT,
        lane=args.lane,
        api_log_path=args.api_log,
        playwright_log_path=args.playwright_log,
    )

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
