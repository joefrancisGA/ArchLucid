#!/usr/bin/env python3
"""Build a concise human-readable RC decision narrative from existing release artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import load_json, repo_root  # noqa: E402

_SCHEMA = "archlucid.rc-decision-narrative.v1"


def _read(path: Path) -> dict[str, Any] | None:
    payload = load_json(path)

    if payload is None:
        return None

    return payload


def _top_risks(
    verdict: dict[str, Any] | None,
    signoff: dict[str, Any] | None,
    timing: dict[str, Any] | None,
) -> list[str]:
    risks: list[str] = []

    for blocker in (verdict or {}).get("blockers") or []:
        if isinstance(blocker, str) and blocker.strip():
            risks.append(blocker.strip())

    for gate in (signoff or {}).get("gates") or []:
        if not isinstance(gate, dict):
            continue

        status = str(gate.get("status") or "").upper()

        if status in {"HOLD", "FAIL", "WARN"}:
            label = str(gate.get("label") or gate.get("id") or "gate")
            reason = str(gate.get("reason") or status)
            risks.append(f"{label}: {reason}")

    budget = (timing or {}).get("firstValueCommitBudget") if timing else None

    if isinstance(budget, dict):
        disposition = str(budget.get("disposition") or "").upper()

        if disposition in {"HOLD", "WARN"}:
            risks.append(f"First-value timing: {budget.get('detail') or disposition}")

    deduped: list[str] = []

    for risk in risks:
        if risk not in deduped:
            deduped.append(risk)

    return deduped[:5]


def build_narrative(bundle_dir: Path) -> dict[str, Any]:
    verdict = _read(bundle_dir / "rc-go-no-go-verdict.json")
    signoff = _read(bundle_dir / "rc-evidence-signoff-bundle.json")
    timing = _read(bundle_dir / "first-pilot-timing-budget.json")
    readiness = _read(bundle_dir / "release-readiness-index.json")

    rollup_verdict = str((verdict or {}).get("verdict") or "HOLD").upper()
    safe_line = "Safe to release for controlled RC signoff." if rollup_verdict == "PASS" else (
        "Hold release — resolve blockers before buyer-facing RC signoff."
        if rollup_verdict == "HOLD"
        else "Release with documented residual risks (WARN)."
    )

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "verdict": rollup_verdict,
        "safeToReleaseLine": safe_line,
        "releaseReadinessRollup": (readiness or {}).get("rollup"),
        "topRisks": _top_risks(verdict, signoff, timing),
        "firstValueTimingDisposition": (
            (timing or {}).get("firstValueCommitBudget", {}).get("disposition")
            if isinstance((timing or {}).get("firstValueCommitBudget"), dict)
            else None
        ),
        "references": {
            "rcGoNoGoVerdict": "rc-go-no-go-verdict.json",
            "rcEvidenceSignoffBundle": "rc-evidence-signoff-bundle.json",
            "firstPilotTimingBudget": "first-pilot-timing-budget.json",
            "releaseReadinessIndex": "release-readiness-index.json",
        },
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# RC decision narrative",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Overall verdict:** **{payload['verdict']}**",
        "",
        f"**Decision line:** {payload['safeToReleaseLine']}",
        "",
    ]

    if payload.get("releaseReadinessRollup"):
        lines.extend(
            [
                f"Release readiness rollup: **{payload['releaseReadinessRollup']}**",
                "",
            ]
        )

    timing = payload.get("firstValueTimingDisposition")

    if timing:
        lines.extend(
            [
                f"First-value timing disposition: **{timing}**",
                "",
            ]
        )

    risks = payload.get("topRisks") or []

    if risks:
        lines.append("## Top residual risks / blockers")
        lines.append("")

        for risk in risks:
            lines.append(f"- {risk}")

        lines.append("")

    lines.extend(
        [
            "## Source artifacts",
            "",
            "| Artifact | Role |",
            "| --- | --- |",
        ]
    )

    for key, value in (payload.get("references") or {}).items():
        lines.append(f"| `{value}` | {key} |")

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
    payload = build_narrative(args.bundle_dir.resolve())

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"RC decision narrative: {payload['verdict']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
