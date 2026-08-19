#!/usr/bin/env python3
"""Fail-closed guard for RC strict signoff machine-readable outputs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.rc-strict-signoff-assertion.v1"
_STALE_AFTER_DAYS = 7

_STRICT_ARTIFACTS: tuple[tuple[str, str], ...] = (
    ("release-confidence-rollup.json", "strictDisposition"),
    ("rc-evidence-signoff-bundle.json", "overallDisposition"),
    ("rc-go-no-go-verdict.json", "verdict"),
)


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError:
        return None

    return payload if isinstance(payload, dict) else None


def _normalize_pass(raw: object | None) -> bool:
    value = str(raw or "").strip().upper()
    return value in {"PASS", "READY", "GO", "APPROVE"}


def _blocking_reason(
    *,
    artifact: str,
    field: str,
    detail: str,
) -> dict[str, str]:
    return {
        "artifact": artifact,
        "field": field,
        "detail": detail,
    }


def evaluate_bundle(
    bundle_dir: Path,
    *,
    require_pass: bool,
    require_live_parity_artifact: bool,
) -> dict[str, Any]:
    blockers: list[dict[str, str]] = []

    for artifact_name, disposition_field in _STRICT_ARTIFACTS:
        path = bundle_dir / artifact_name
        payload = _load_json(path)

        if payload is None:
            blockers.append(
                _blocking_reason(
                    artifact=artifact_name,
                    field=disposition_field,
                    detail="artifact missing — strict RC signoff requires machine-readable output",
                )
            )
            continue

        disposition = payload.get(disposition_field)

        if require_pass and not _normalize_pass(disposition):
            extra = ""

            if artifact_name == "release-confidence-rollup.json":
                reasons = payload.get("strictBlockingReasons") or []
                if isinstance(reasons, list) and reasons:
                    extra = f"; strictBlockingReasons={reasons[:5]}"

            if artifact_name == "rc-go-no-go-verdict.json":
                verdict_blockers = payload.get("blockers") or []
                if isinstance(verdict_blockers, list) and verdict_blockers:
                    extra = f"; blockers={verdict_blockers[:5]}"

            if artifact_name == "rc-evidence-signoff-bundle.json":
                skipped = payload.get("skippedHighRiskGates") or []
                if isinstance(skipped, list) and skipped:
                    extra = f"; skippedHighRiskGates={skipped[:8]}"

            blockers.append(
                _blocking_reason(
                    artifact=artifact_name,
                    field=disposition_field,
                    detail=f"{disposition_field}={disposition!r} (expected PASS){extra}",
                )
            )

    if require_live_parity_artifact:
        parity_path = bundle_dir / "release-smoke-live-ui-sql-result.json"
        parity = _load_json(parity_path)

        if parity is None:
            blockers.append(
                _blocking_reason(
                    artifact="release-smoke-live-ui-sql-result.json",
                    field="evidenceKind",
                    detail=(
                        "live UI-SQL parity artifact missing — run "
                        "scripts/release-smoke-rc.ps1 -ResultOut artifacts/release-smoke-live-ui-sql-result.json"
                    ),
                )
            )
        else:
            evidence_kind = str(parity.get("evidenceKind") or "").lower()
            verdict = str(parity.get("verdict") or parity.get("status") or "").strip().upper()

            if evidence_kind != "live-ui-sql-parity":
                blockers.append(
                    _blocking_reason(
                        artifact="release-smoke-live-ui-sql-result.json",
                        field="evidenceKind",
                        detail=f"expected live-ui-sql-parity, got {evidence_kind!r}",
                    )
                )

            if verdict != "PASS":
                blockers.append(
                    _blocking_reason(
                        artifact="release-smoke-live-ui-sql-result.json",
                        field="verdict",
                        detail=f"expected Pass/PASS, got {verdict!r}",
                    )
                )

            profile = str(parity.get("profile") or "")
            if profile not in {"LiveUiSql", "ReleaseCandidate"}:
                blockers.append(
                    _blocking_reason(
                        artifact="release-smoke-live-ui-sql-result.json",
                        field="profile",
                        detail=f"expected LiveUiSql or ReleaseCandidate, got {profile!r}",
                    )
                )

    signoff = _load_json(bundle_dir / "rc-evidence-signoff-bundle.json") or {}
    references = signoff.get("references") if isinstance(signoff.get("references"), dict) else {}

    for ref_key, ref_name in (
        ("releaseConfidenceRollup", "release-confidence-rollup.json"),
        ("rcGoNoGoVerdict", "rc-go-no-go-verdict.json"),
    ):
        if ref_key not in references:
            blockers.append(
                _blocking_reason(
                    artifact="rc-evidence-signoff-bundle.json",
                    field=f"references.{ref_key}",
                    detail=f"signoff bundle must reference {ref_name} for machine-readable RC handoff",
                )
            )

    return {
        "schema": _SCHEMA,
        "bundleDir": bundle_dir.as_posix(),
        "requirePass": require_pass,
        "requireLiveParityArtifact": require_live_parity_artifact,
        "disposition": "PASS" if not blockers else "HOLD",
        "blockingReasons": blockers,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument(
        "--require-pass",
        action="store_true",
        help="Require strictDisposition/overallDisposition/verdict to be PASS (buyer-facing RC cut).",
    )
    parser.add_argument(
        "--require-live-parity-artifact",
        action="store_true",
        help="Require release-smoke-live-ui-sql-result.json with live-ui-sql-parity evidenceKind.",
    )
    parser.add_argument("--json-out", type=Path, default=None)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    bundle_dir = args.bundle_dir.resolve()
    report = evaluate_bundle(
        bundle_dir,
        require_pass=args.require_pass,
        require_live_parity_artifact=args.require_live_parity_artifact,
    )

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if report["disposition"] == "PASS":
        print(f"assert_rc_strict_signoff: PASS bundle={bundle_dir}")
        return 0

    print(
        f"assert_rc_strict_signoff: HOLD — {len(report['blockingReasons'])} blocking issue(s)",
        file=sys.stderr,
    )

    for item in report["blockingReasons"]:
        message = f"{item['artifact']} ({item['field']}): {item['detail']}"
        print(f"::error::{message}", file=sys.stderr)
        print(f"  - {message}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
