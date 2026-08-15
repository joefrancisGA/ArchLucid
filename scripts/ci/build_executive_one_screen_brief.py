#!/usr/bin/env python3
"""Generate a one-screen sponsor brief from existing pilot/release evidence artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import load_json  # noqa: E402

_SCHEMA = "archlucid.sponsor-one-screen-brief.v1"


def _disposition_label(raw: Any) -> str:
    value = str(raw or "NOT_COLLECTED").upper()

    if value in {"PASS", "READY", "VALID"}:
        return "PASS"

    if value in {"WARN", "PARTIAL", "STALE"}:
        return "WARN"

    if value in {"HOLD", "FAIL", "INVALID"}:
        return "HOLD"

    return value


def build_brief(bundle_dir: Path) -> dict[str, Any]:
    verdict = load_json(bundle_dir / "rc-go-no-go-verdict.json") or {}
    narrative = load_json(bundle_dir / "rc-decision-narrative.json") or {}
    timing = load_json(bundle_dir / "first-pilot-timing-budget.json") or {}
    claim = load_json(bundle_dir / "real-mode-claim-gate.json") or {}
    readiness = load_json(bundle_dir / "release-readiness-index.json") or {}

    timing_budget = timing.get("firstValueCommitBudget") if isinstance(timing.get("firstValueCommitBudget"), dict) else {}

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "readinessDisposition": _disposition_label(verdict.get("verdict") or narrative.get("verdict")),
        "releaseReadinessRollup": readiness.get("rollup"),
        "claimWordingClass": claim.get("claimWordingClass") or claim.get("disposition"),
        "roiBasisConfidence": "Measured timing when staging-smoke attached; otherwise guidance-only — not an SLA.",
        "firstValueTiming": {
            "disposition": timing_budget.get("disposition"),
            "detail": timing_budget.get("detail"),
        },
        "topRisks": (narrative.get("topRisks") or verdict.get("blockers") or [])[:3],
        "caveats": [
            "Simulator-only AI evidence does not prove production LLM quality.",
            "Self-assessed SOC 2 posture is not CPA attestation.",
            "Commerce (live Stripe / Marketplace) remains owner-gated unless explicitly un-held.",
        ],
        "references": {
            "rcDecisionNarrative": "rc-decision-narrative.json",
            "rcGoNoGoVerdict": "rc-go-no-go-verdict.json",
            "firstPilotTimingBudget": "first-pilot-timing-budget.json",
            "realModeClaimGate": "real-mode-claim-gate.json",
        },
    }


def render_markdown(payload: dict[str, Any]) -> str:
    risks = payload.get("topRisks") or []
    timing = payload.get("firstValueTiming") or {}

    lines = [
        "# Sponsor one-screen brief",
        "",
        f"**Readiness:** **{payload.get('readinessDisposition')}** · "
        f"Release rollup: **{payload.get('releaseReadinessRollup') or 'n/a'}** · "
        f"Claim class: **{payload.get('claimWordingClass') or 'n/a'}**",
        "",
        "## First-value timing",
        "",
        f"- Disposition: **{timing.get('disposition') or 'NOT_COLLECTED'}**",
        f"- Detail: {timing.get('detail') or 'Attach staging-smoke timings for measured budget.'}",
        "",
        "## Top risks",
        "",
    ]

    if risks:
        for risk in risks:
            lines.append(f"- {risk}")
    else:
        lines.append("- None surfaced in attached RC artifacts.")

    lines.extend(["", "## ROI / evidence confidence", "", f"- {payload.get('roiBasisConfidence')}", "", "## Caveats", ""])

    for caveat in payload.get("caveats") or []:
        lines.append(f"- {caveat}")

    lines.append("")
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = build_brief(args.bundle_dir.resolve())

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"Sponsor one-screen brief: {payload['readinessDisposition']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
