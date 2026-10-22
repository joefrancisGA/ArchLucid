#!/usr/bin/env python3
"""Consolidate V1 scale envelope evidence (measured vs configured vs untested)."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_optional_json(path: Path | None) -> dict | None:
    if path is None or not path.is_file():
        return None

    return json.loads(path.read_text(encoding="utf-8"))


def build_scale_envelope_summary(
    *,
    performance_baseline_path: Path | None,
    k6_summary_path: Path | None,
) -> dict[str, object]:
    measured: list[dict[str, str]] = []
    configured: list[dict[str, str]] = []
    untested: list[dict[str, str]] = []

    baseline = load_optional_json(performance_baseline_path)

    if baseline is not None:
        measured.append(
            {
                "signal": "first-pilot-performance-baseline",
                "source": str(performance_baseline_path),
                "note": "Observed staging-smoke step latencies — not a load test or SLA.",
            },
        )

    k6 = load_optional_json(k6_summary_path)

    if k6 is not None:
        measured.append(
            {
                "signal": "k6-summary-attached",
                "source": str(k6_summary_path),
                "note": "Attached k6 summary — label as ci-smoke or production-like in proof; not contractual SLA.",
            },
        )

    configured.extend(
        [
            {
                "signal": "single-region-v1",
                "source_doc": "docs/library/PERFORMANCE.md",
                "note": "V1 pilot envelope is single-region; no active/active claim.",
            },
            {
                "signal": "sql-backed-persistence",
                "source_doc": "docs/library/CONFIGURATION_REFERENCE.md",
                "note": "ArchLucid:StorageProvider=Sql is the measured CI/staging default.",
            },
            {
                "signal": "optional-redis-hot-path-cache",
                "source_doc": "docs/library/PERFORMANCE.md",
                "note": "HotPathCache is optional; disabled by default in many pilots.",
            },
            {
                "signal": "llm-budget-caps",
                "source_doc": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
                "note": "LLM budget status is buyer-safe posture, not invoice-grade cost truth.",
            },
            {
                "signal": "health-probes",
                "source_doc": "docs/library/API_CONTRACTS.md",
                "note": "/health/live and /health/ready are engineering targets, not contractual SLA.",
            },
        ],
    )

    untested.extend(
        [
            {
                "signal": "multi-region-active-active",
                "source_doc": "docs/library/V1_DEFERRED.md",
                "note": "Not proven in V1; do not claim in buyer materials.",
            },
            {
                "signal": "production-sla-warranty",
                "source_doc": "docs/library/API_SLOS.md",
                "note": "SLO narrative is separate from CI k6 regression ceilings.",
            },
            {
                "signal": "real-llm-peak-throughput",
                "source_doc": "docs/library/PERFORMANCE.md",
                "note": "Simulator-mode k6 does not prove Azure OpenAI queueing or token tails.",
            },
        ],
    )

    if baseline is None:
        untested.append(
            {
                "signal": "first-pilot-step-latencies",
                "source_doc": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
                "note": "Run ./scripts/staging-smoke.ps1 and attach -StagingSmokeResultsPath to proof.",
            },
        )

    disposition = "PASS" if measured or configured else "WARN"

    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "measured_evidence": measured,
        "configured_targets": configured,
        "untested_assumptions": untested,
        "profiles": {
            "first_pilot": "Single review commit path; staging-smoke timings when collected.",
            "team": "Repeated reviews + compare; requires fresh k6/soak on your subscription.",
            "enterprise_evaluation": "Requires production-like k6 + hosted probes; not implied by V1 pilot proof alone.",
        },
    }


def format_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# V1 scale envelope evidence",
        "",
        "Separates **measured evidence**, **configured targets**, and **untested assumptions** for V1 pilots.",
        "Does **not** claim multi-region active/active, production SLA, or load-test benchmarks unless you attach fresh measurements.",
        "",
        f"| Disposition | **{summary['disposition']}** |",
        "",
        "## Profiles",
        "",
    ]

    profiles = summary.get("profiles") or {}

    for key, note in profiles.items():
        lines.append(f"- **{key}:** {note}")

    for section_key, title in (
        ("measured_evidence", "Measured evidence"),
        ("configured_targets", "Configured targets"),
        ("untested_assumptions", "Untested assumptions (honest bounds)"),
    ):
        lines.extend(["", f"## {title}", ""])
        rows = summary.get(section_key) or []

        if not rows:
            lines.append("- None recorded.")
            continue

        for row in rows:
            source = row.get("source") or row.get("source_doc") or "—"
            lines.append(f"- **{row.get('signal', 'signal')}** — {row.get('note', '')} (`{source}`)")

    lines.append("")
    lines.append("Canonical narrative: [PERFORMANCE.md](../library/PERFORMANCE.md).")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--performance-baseline-json", type=Path, default=None)
    parser.add_argument("--k6-summary-json", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    summary = build_scale_envelope_summary(
        performance_baseline_path=args.performance_baseline_json,
        k6_summary_path=args.k6_summary_json,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(format_markdown(summary), encoding="utf-8")

    print(f"scale envelope evidence: {summary['disposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
