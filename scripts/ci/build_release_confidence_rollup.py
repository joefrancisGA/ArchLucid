#!/usr/bin/env python3
"""Build release-confidence-rollup.json/.md from attached lane status artifacts."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.release-confidence-rollup.v1"
_LANES_PATH = Path(__file__).resolve().parent / "data" / "release_confidence_lanes.v1.json"
_STALE_AFTER_DAYS = 7


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None

    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError:
        return None

    return value if isinstance(value, dict) else None


def parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None

    normalized = value.strip().replace("Z", "+00:00")

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def find_status_file(root: Path, bundle_dir: Path, relative_paths: list[str]) -> tuple[Path | None, str]:
    for relative in relative_paths:
        candidate = bundle_dir / relative

        if candidate.is_file():
            return candidate, "release-bundle"

    for relative in relative_paths:
        candidate = root / relative

        if candidate.is_file():
            return candidate, "repo-artifact"

    return None, "missing"


def lane_status_from_payload(payload: dict[str, Any] | None, path: Path | None) -> dict[str, Any]:
    if payload is None:
        return {
            "status": "MISSING",
            "generatedUtc": None,
            "daysOld": None,
            "isCurrent": False,
            "exitCode": None,
            "detail": "lane status artifact not attached",
            "source": None,
            "sourceScope": "missing",
        }

    raw_status = str(payload.get("status") or payload.get("rollup") or payload.get("disposition") or "UNKNOWN").upper()
    generated = parse_datetime(payload.get("generatedUtc") or payload.get("capturedUtc"))
    days_old = None
    is_current = False

    if generated is not None:
        days_old = (datetime.now(timezone.utc) - generated).days
        is_current = days_old <= _STALE_AFTER_DAYS

    status = raw_status

    if raw_status in {"PASS", "READY"}:
        status = "PASS" if is_current or generated is None else "STALE"
    elif raw_status in {"FAIL", "HOLD", "BLOCK"}:
        status = "HOLD"
    elif raw_status in {"WARN", "PARTIAL"}:
        status = "WARN"
    elif raw_status in {"SKIPPED", "NOT_COLLECTED", "NOT_RUN"}:
        status = "MISSING"
    elif raw_status == "UNKNOWN":
        status = "MISSING"

    exit_code = payload.get("exitCode")

    if exit_code is not None and int(exit_code) != 0 and status == "PASS":
        status = "HOLD"

    if path is not None and "validation" in path.name.lower():
        valid = payload.get("valid")

        if valid is False:
            status = "HOLD"
        elif valid is True and status == "MISSING":
            status = "PASS"

    return {
        "status": status,
        "generatedUtc": generated.isoformat() if generated else payload.get("generatedUtc"),
        "daysOld": days_old,
        "isCurrent": is_current if generated is not None else None,
        "exitCode": exit_code,
        "detail": str(payload.get("detail") or payload.get("summary") or ""),
        "source": str(path) if path else None,
        "sourceScope": "release-bundle" if path else "missing",
    }


def rollup_disposition(lanes: list[dict[str, Any]]) -> str:
    statuses = [str(lane["status"]).upper() for lane in lanes]

    if all(status == "MISSING" for status in statuses):
        return "NOT_COLLECTED"

    blocking = [lane for lane in lanes if lane.get("releaseBlocking")]

    if any(str(lane["status"]).upper() in {"HOLD", "FAIL"} for lane in blocking):
        return "HOLD"

    if any(str(lane["status"]).upper() in {"STALE", "WARN"} for lane in lanes):
        return "WARN"

    if any(str(lane["status"]).upper() == "MISSING" for lane in blocking):
        return "PARTIAL"

    return "PASS"


def build_rollup(root: Path, bundle_dir: Path) -> dict[str, Any]:
    lane_config = json.loads(_LANES_PATH.read_text(encoding="utf-8"))
    lane_rows: list[dict[str, Any]] = []

    for lane in lane_config["lanes"]:
        path, scope = find_status_file(root, bundle_dir, lane["statusFiles"])
        payload = load_json(path) if path else None
        status_row = lane_status_from_payload(payload, path)
        status_row["sourceScope"] = scope if path else "missing"
        lane_rows.append(
            {
                "id": lane["id"],
                "label": lane["label"],
                "releaseBlocking": lane["releaseBlocking"],
                "laneDetail": lane["detail"],
                **status_row,
            }
        )

    readiness = load_json(bundle_dir / "release-readiness-index.json")

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": rollup_disposition(lane_rows),
        "staleAfterDays": _STALE_AFTER_DAYS,
        "releaseReadinessRollup": readiness.get("rollup") if readiness else None,
        "lanes": lane_rows,
        "interpretation": (
            "Lanes are explicit: MISSING and STALE are not PASS. "
            "Full regression is not executed by the default local emitter."
        ),
    }


def validate_rollup(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    if payload.get("schema") != _SCHEMA:
        errors.append(f"schema must be {_SCHEMA}")

    lanes = payload.get("lanes")

    if not isinstance(lanes, list) or len(lanes) == 0:
        errors.append("lanes must be a non-empty array")

    return errors


def render_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Release confidence rollup",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        "",
        f"Disposition: **{summary['disposition']}**",
        "",
        "| Lane | Status | Release-blocking | Source | Detail |",
        "| --- | --- | :---: | --- | --- |",
    ]

    for lane in summary["lanes"]:
        source = lane.get("source") or "(missing)"
        detail = str(lane.get("detail") or lane.get("laneDetail") or "")[:120].replace("|", "/")
        blocking = "yes" if lane.get("releaseBlocking") else "no"
        lines.append(
            f"| {lane['label']} | **{lane['status']}** | {blocking} | `{source}` | {detail} |"
        )

    lines.extend(["", str(summary["interpretation"]), ""])
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = args.repo_root.resolve()
    bundle_dir = args.bundle_dir.resolve()
    summary = build_rollup(root, bundle_dir)
    errors = validate_rollup(summary)

    if errors:
        raise SystemExit(f"Invalid rollup: {'; '.join(errors)}")

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
