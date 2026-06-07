#!/usr/bin/env python3
"""Shared helpers for release evidence CI scripts."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

STRICT_RC_BLOCKING_STATUSES = frozenset({"MISSING", "STALE", "WARN", "HOLD", "FAIL"})


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


def first_existing(root: Path, bundle_dir: Path, relative_paths: list[str]) -> tuple[Path | None, str]:
    for relative in relative_paths:
        candidate = bundle_dir / relative

        if candidate.is_file():
            return candidate, "release-bundle"

    for relative in relative_paths:
        candidate = root / relative

        if candidate.is_file():
            return candidate, "repo-artifact"

    return None, "missing"


def strict_rc_lane_reason(lane: dict[str, Any]) -> str | None:
    if not lane.get("releaseBlocking"):
        return None

    status = str(lane.get("status") or "MISSING").upper()

    if status in STRICT_RC_BLOCKING_STATUSES:
        label = str(lane.get("label") or lane.get("id") or "lane")
        return f"{label}: {status}"

    return None


def evaluate_strict_rc(lanes: list[dict[str, Any]]) -> tuple[str, list[str]]:
    reasons: list[str] = []

    for lane in lanes:
        reason = strict_rc_lane_reason(lane)

        if reason is not None:
            reasons.append(reason)

    disposition = "PASS" if not reasons else "HOLD"
    return disposition, reasons


def map_roi_basis_to_completeness(roi_basis_status: str) -> str:
    normalized = (roi_basis_status or "not-collected").strip().lower()

    if normalized in {"buyer-provided", "classified", "complete"}:
        return "COMPLETE"

    if normalized in {"defaulted", "default"}:
        return "DEFAULTED"

    if normalized in {"demo-derived", "partial", "partial-defaulted"}:
        return "PARTIAL"

    return "NOT_COLLECTED"
