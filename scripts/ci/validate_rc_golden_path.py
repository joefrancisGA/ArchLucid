#!/usr/bin/env python3
"""Validate V1 RC golden-path mandatory artifacts (pilot-facing release evidence)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.rc-golden-path-validator.v1"

# Explicitly deferred — never fail V1 RC golden-path validation when only these are absent.
_DEFERRED_SCOPE_ARTIFACTS: frozenset[str] = frozenset(
    {
        "soc2-cpa-attestation.json",
        "third-party-pentest-report.json",
        "marketplace-listing-status.json",
        "mcp-connector-readiness.json",
        "multi-region-active-active-readiness.json",
    }
)

_MANDATORY_CHECKS: tuple[tuple[str, str, bool], ...] = (
    (
        "Release readiness rollup",
        "release-readiness-index.json",
        True,
    ),
    (
        "RC go/no-go verdict",
        "rc-go-no-go-verdict.json",
        True,
    ),
    (
        "Real-mode claim disposition",
        "real-mode-claim-gate.json",
        True,
    ),
    (
        "Live UI + SQL parity smoke",
        "release-smoke-live-ui-sql-result.json",
        True,
    ),
    (
        "Data consistency readiness",
        "data-consistency-readiness.json",
        True,
    ),
    (
        "First-pilot timing budget",
        "first-pilot-timing-budget.json",
        False,
    ),
    (
        "Simulator/live divergence rollup",
        "simulator-live-divergence-summary.json",
        True,
    ),
    (
        "AI quality release summary",
        "ai-quality-release-summary.json",
        False,
    ),
)


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError:
        return None

    return payload if isinstance(payload, dict) else None


def _normalize_verdict(raw: object | None) -> str:
    value = str(raw or "").strip().upper()

    if value in {"", "UNKNOWN", "NOT_COLLECTED", "MISSING", "SKIPPED", "NOT_RUN"}:
        return "MISSING"

    if value in {"DEFERRED", "DEFERRED_SCOPE"}:
        return "DEFERRED_SCOPE"

    if value in {"FAIL", "BLOCK", "HOLD", "HOLD_FOR_OWNER_SIGNOFF"}:
        return "HOLD"

    if value in {"WARN", "PARTIAL", "PASS_WITH_WARNINGS"}:
        return "WARN"

    if value == "PASS":
        return "PASS"

    return "WARN"


def _extract_disposition(payload: dict[str, Any] | None) -> str | None:
    if payload is None:
        return None

    for key in ("disposition", "verdict", "status", "rollup", "overallOutcome", "overallVerdict"):
        if key in payload and payload[key] is not None:
            return str(payload[key])

    return None


def _evaluate_row(
    bundle_dir: Path,
    name: str,
    artifact: str,
    sponsor_critical: bool,
) -> dict[str, Any]:
    if artifact in _DEFERRED_SCOPE_ARTIFACTS:
        return {
            "name": name,
            "artifact": artifact,
            "sponsorCritical": sponsor_critical,
            "verdict": "DEFERRED_SCOPE",
            "detail": "explicitly deferred V1.1/V2 — not a V1 RC golden-path failure",
        }

    path = bundle_dir / artifact

    if not path.is_file():
        verdict = "HOLD" if sponsor_critical else "MISSING"
        return {
            "name": name,
            "artifact": artifact,
            "sponsorCritical": sponsor_critical,
            "verdict": verdict,
            "detail": "artifact not attached",
        }

    payload = _load_json(path)

    if payload is None:
        return {
            "name": name,
            "artifact": artifact,
            "sponsorCritical": sponsor_critical,
            "verdict": "WARN",
            "detail": "artifact present but unreadable",
        }

    disposition = _normalize_verdict(_extract_disposition(payload))

    if disposition == "MISSING":
        disposition = "WARN"

    if sponsor_critical and disposition in {"WARN", "MISSING"}:
        disposition = "HOLD"

    return {
        "name": name,
        "artifact": artifact,
        "sponsorCritical": sponsor_critical,
        "verdict": disposition,
        "detail": f"disposition={_extract_disposition(payload)}",
    }


def build_validation(bundle_dir: Path) -> dict[str, Any]:
    rows = [_evaluate_row(bundle_dir, name, artifact, critical) for name, artifact, critical in _MANDATORY_CHECKS]
    hold_count = sum(1 for row in rows if row["verdict"] == "HOLD")
    warn_count = sum(1 for row in rows if row["verdict"] == "WARN")
    pass_count = sum(1 for row in rows if row["verdict"] == "PASS")
    missing_count = sum(1 for row in rows if row["verdict"] == "MISSING")
    optional_missing = sum(
        1 for row in rows if row["verdict"] == "MISSING" and not row["sponsorCritical"]
    )

    rollup = "PASS"

    if hold_count > 0:
        rollup = "HOLD"
    elif warn_count > 0 or (missing_count > 0 and missing_count != optional_missing):
        rollup = "WARN"

    claim_gate = _load_json(bundle_dir / "real-mode-claim-gate.json") or {}
    proof_rollup = _load_json(bundle_dir / "first-pilot-proof-rollup.json") or {}

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "bundleDir": str(bundle_dir),
        "rollup": rollup,
        "claimWordingClass": claim_gate.get("claimWordingClass"),
        "proofPacketDisposition": proof_rollup.get("sponsorHandoffDisposition") or proof_rollup.get("rollup"),
        "counts": {
            "pass": pass_count,
            "warn": warn_count,
            "hold": hold_count,
            "missing": missing_count,
            "deferredScope": sum(1 for row in rows if row["verdict"] == "DEFERRED_SCOPE"),
        },
        "verdictLegend": {
            "PASS": "Attached and passing",
            "WARN": "Attached with caveats — internal RC prep only",
            "HOLD": "Pilot-facing RC blocker — missing or failing mandatory evidence",
            "MISSING": "Optional artifact not attached",
            "DEFERRED_SCOPE": "Explicitly deferred — never fails V1 golden-path gate",
        },
        "rows": rows,
    }


def write_markdown(summary: dict[str, Any], path: Path) -> None:
    lines = [
        "# RC golden-path evidence validation",
        "",
        f"Generated (UTC): **{summary['generatedUtc']}**",
        f"Rollup: **{summary['rollup']}**",
        "",
    ]

    if summary.get("claimWordingClass"):
        lines.append(f"Claim wording class: **{summary['claimWordingClass']}**")
        lines.append("")

    if summary.get("proofPacketDisposition"):
        lines.append(f"Proof packet disposition: **{summary['proofPacketDisposition']}**")
        lines.append("")

    lines.extend(
        [
            "| Check | Verdict | Sponsor-critical | Artifact | Detail |",
            "| --- | --- | --- | --- | --- |",
        ]
    )

    for row in summary["rows"]:
        critical = "yes" if row["sponsorCritical"] else "no"
        detail = str(row["detail"]).replace("|", "/")
        lines.append(
            f"| {row['name']} | **{row['verdict']}** | {critical} | `{row['artifact']}` | {detail} |"
        )

    lines.extend(
        [
            "",
            "Deferred V1.1/V2 assurance (SOC 2 CPA, third-party pen test, MCP, marketplace) are **never** required here.",
            "",
            "See [`docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../../docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md).",
        ]
    )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", required=True, help="Release readiness output directory")
    parser.add_argument("--json-out", required=True)
    parser.add_argument("--markdown-out", required=True)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 when rollup is HOLD (for StrictRc pipelines)",
    )
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir).expanduser().resolve()

    if not bundle_dir.is_dir():
        print(f"bundle dir not found: {bundle_dir}", file=sys.stderr)
        return 2

    summary = build_validation(bundle_dir)
    json_path = Path(args.json_out).expanduser().resolve()
    md_path = Path(args.markdown_out).expanduser().resolve()
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_markdown(summary, md_path)

    if args.enforce and summary["rollup"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
