#!/usr/bin/env python3
"""Build unified rc-evidence-index.json/.md for release-candidate signoff."""

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

_SCHEMA = "archlucid.rc-evidence-index.v1"

_CANONICAL_ROWS: tuple[tuple[str, str, str, bool], ...] = (
    ("Health and version", "health-version.json", "Live or repo-local health/version stamp", False),
    ("OpenAPI snapshot", "openapi-v1.json", "Contract snapshot for RC", False),
    ("Release readiness checks", "release-readiness-index.json", "Unified readiness rollup", True),
    ("Release confidence rollup", "release-confidence-rollup.json", "Validation lane synthesis", True),
    ("Real-mode AI evidence", "real-llm-evidence-gate.json", "Owner-approved real AOAI gate", True),
    ("Real-mode claim gate", "real-mode-claim-gate.json", "Claim wording boundary for RC", True),
    ("RC go/no-go verdict", "rc-go-no-go-verdict.json", "Machine-readable RC signoff", True),
    ("Data consistency readiness", "data-consistency-readiness.json", "Cross-store consistency posture", False),
    ("Observability export readiness", "observability-export-readiness-production.json", "Telemetry export config", False),
    ("Procurement deal-ready", "procurement-deal-ready.json", "Mid-market pilot procurement posture", False),
    ("First-pilot timing budget", "first-pilot-timing-budget.json", "Create→commit→artifact budget", False),
    ("Live UI-SQL parity", "release-smoke-live-ui-sql-result.json", "Browser parity smoke (RC)", False),
    ("AI quality proof", "ai-quality-release-summary.json", "Agent corpus / quality summary", False),
    ("Architecture invariant RC", "architecture-invariant-rc-summary.json", "Convention vs enforced invariants", False),
    ("Simulator/live divergence", "simulator-live-divergence-summary.json", "Schema-valid output divergence", True),
)


def _normalize_verdict(raw: str | None, *, sponsor_critical: bool) -> str:
    value = (raw or "").strip().upper()

    if value in {"", "UNKNOWN", "NOT_COLLECTED", "MISSING", "SKIPPED"}:
        return "NOT_RUN"

    if value in {"DEFERRED", "DEFERRED_SCOPE"}:
        return "DEFERRED_SCOPE"

    if value in {"FAIL", "BLOCK", "HOLD", "HOLD_FOR_OWNER_SIGNOFF"}:
        return "HOLD"

    if value in {"WARN", "PARTIAL", "PASS_WITH_WARNINGS"}:
        return "WARN"

    if value == "PASS":
        return "PASS"

    if sponsor_critical:
        return "HOLD"

    return "WARN"


def _artifact_verdict(bundle_dir: Path, artifact: str, sponsor_critical: bool) -> tuple[str, str]:
    path = bundle_dir / artifact

    if not path.is_file():
        return ("NOT_RUN", "artifact not attached")

    payload = load_json(path)

    if payload is None:
        return ("WARN", "artifact present but unreadable")

    for key in ("verdict", "disposition", "status", "rollup", "overallOutcome", "overallVerdict"):
        if key in payload and payload[key] is not None:
            return (_normalize_verdict(str(payload[key]), sponsor_critical=sponsor_critical), f"{key}={payload[key]}")

    return ("PASS", "artifact attached")


def _claim_gate_verdict(bundle_dir: Path) -> tuple[str, str]:
    payload = load_json(bundle_dir / "real-mode-claim-gate.json") or {}
    disposition = payload.get("disposition") or payload.get("claimDisposition")

    if disposition is None:
        return ("NOT_RUN", "real-mode-claim-gate.json missing")

    return (_normalize_verdict(str(disposition), sponsor_critical=True), f"claimDisposition={disposition}")


def _real_mode_verdict(bundle_dir: Path) -> tuple[str, str]:
    payload = load_json(bundle_dir / "real-llm-evidence-gate.json") or {}
    status = payload.get("overallOutcome") or payload.get("status")

    if status is None:
        manifest = load_json(bundle_dir / "release-evidence-bundle-manifest.json") or {}
        nested = manifest.get("realModeAiEvidence") if isinstance(manifest.get("realModeAiEvidence"), dict) else {}
        status = nested.get("status")

    if status is None:
        return ("NOT_RUN", "real-llm-evidence-gate.json missing")

    return (_normalize_verdict(str(status), sponsor_critical=True), f"realMode={status}")


def build_index(root: Path, bundle_dir: Path) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    hold_count = 0
    warn_count = 0
    pass_count = 0

    for name, artifact, purpose, sponsor_critical in _CANONICAL_ROWS:
        if artifact == "real-mode-claim-gate.json":
            verdict, detail = _claim_gate_verdict(bundle_dir)
        elif artifact == "real-llm-evidence-gate.json":
            verdict, detail = _real_mode_verdict(bundle_dir)
        else:
            verdict, detail = _artifact_verdict(bundle_dir, artifact, sponsor_critical)

        if verdict == "HOLD":
            hold_count += 1
        elif verdict == "WARN":
            warn_count += 1
        elif verdict == "PASS":
            pass_count += 1

        rows.append(
            {
                "name": name,
                "artifact": artifact,
                "purpose": purpose,
                "sponsorCritical": sponsor_critical,
                "verdict": verdict,
                "detail": detail,
            }
        )

    rollup = "PASS"

    if hold_count > 0:
        rollup = "HOLD"
    elif warn_count > 0:
        rollup = "WARN"

    readiness = load_json(bundle_dir / "release-readiness-index.json") or {}
    rc_verdict = load_json(bundle_dir / "rc-go-no-go-verdict.json") or {}

    try:
        bundle_relative = str(bundle_dir.relative_to(root)).replace("\\", "/")
    except ValueError:
        bundle_relative = str(bundle_dir)

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "bundleDir": bundle_relative,
        "gitCommitSha": readiness.get("gitCommitSha") or rc_verdict.get("gitCommitSha"),
        "rollup": rollup,
        "counts": {
            "pass": pass_count,
            "warn": warn_count,
            "hold": hold_count,
            "notRun": sum(1 for r in rows if r["verdict"] == "NOT_RUN"),
            "deferredScope": sum(1 for r in rows if r["verdict"] == "DEFERRED_SCOPE"),
        },
        "verdictLegend": {
            "PASS": "Attached and passing",
            "WARN": "Attached with caveats — acceptable for internal RC prep",
            "HOLD": "Release-critical or sponsor-handoff blocker",
            "NOT_RUN": "Optional artifact not attached",
            "DEFERRED_SCOPE": "Explicitly deferred V1.1/V2 or (B) procurement item",
        },
        "rows": rows,
    }


def write_markdown(index: dict[str, Any], path: Path) -> None:
    lines = [
        "# Release-candidate evidence index",
        "",
        f"Generated (UTC): **{index['generatedUtc']}**",
        f"Commit: **{index.get('gitCommitSha') or 'unknown'}**",
        f"Rollup: **{index['rollup']}**",
        "",
        "| Check | Verdict | Sponsor-critical | Artifact | Detail |",
        "| --- | --- | --- | --- | --- |",
    ]

    for row in index["rows"]:
        critical = "yes" if row["sponsorCritical"] else "no"
        detail = str(row["detail"]).replace("|", "/")
        lines.append(
            f"| {row['name']} | **{row['verdict']}** | {critical} | `{row['artifact']}` | {detail} |"
        )

    lines.extend(
        [
            "",
            "**Generate:** `pwsh ./scripts/Emit-ReleaseReadinessEvidence.ps1 [-StrictRc] [-ApiBaseUrl …]`",
            "",
            "Machine-readable index: `rc-evidence-index.json`. Missing optional artifacts are **NOT_RUN**, not inferred PASS.",
            "",
            "See [`docs/library/V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) and [`docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md).",
        ]
    )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build RC evidence index from release bundle artifacts.")
    parser.add_argument("--bundle-dir", required=True, help="Release readiness output directory")
    parser.add_argument("--json-out", required=True)
    parser.add_argument("--markdown-out", required=True)
    args = parser.parse_args()

    root = repo_root()
    bundle_dir = Path(args.bundle_dir).expanduser().resolve()

    if not bundle_dir.is_dir():
        print(f"bundle dir not found: {bundle_dir}", file=sys.stderr)
        return 2

    index = build_index(root, bundle_dir)
    json_path = Path(args.json_out).expanduser().resolve()
    md_path = Path(args.markdown_out).expanduser().resolve()
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    write_markdown(index, md_path)

    if index["rollup"] == "HOLD":
        return 1

    if index["rollup"] == "WARN":
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
