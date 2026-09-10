#!/usr/bin/env python3
"""Escape-log helpers: path→zone mapping and JSONL validation."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from al_bug_ledger import DEFAULT_LEDGER_PATH, map_paths_to_zone_ids, parse_zones

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ESCAPE_LOG_PATH = REPO_ROOT / "docs/library/AL_BUG_ESCAPE_LOG.jsonl"

VALID_SOURCES = frozenset({"al-defect", "ci", "pilot-proof"})


@dataclass(frozen=True)
class EscapeEntry:
    at: str
    source: str
    zone_id: str
    paths: tuple[str, ...]
    ref: str
    hunted_in_prior_days: int


def read_escape_log(path: Path) -> list[EscapeEntry]:
    if not path.is_file():
        return []
    entries: list[EscapeEntry] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON on line {line_no} of {path}: {exc}") from exc
        entries.append(
            EscapeEntry(
                at=str(payload["at"]),
                source=str(payload["source"]),
                zone_id=str(payload["zoneId"]),
                paths=tuple(str(p) for p in payload.get("paths", [])),
                ref=str(payload["ref"]),
                hunted_in_prior_days=int(payload["huntedInPriorDays"]),
            )
        )
    return entries


def validate_escape_log(path: Path, ledger_text: str) -> list[str]:
    errors: list[str] = []
    zone_ids = set(parse_zones(ledger_text).keys())
    if not path.is_file():
        return errors
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            errors.append(f"line {line_no}: invalid JSON")
            continue
        for key in ("at", "source", "zoneId", "paths", "ref", "huntedInPriorDays"):
            if key not in payload:
                errors.append(f"line {line_no}: missing required field '{key}'")
        source = str(payload.get("source", ""))
        if source and source not in VALID_SOURCES:
            errors.append(f"line {line_no}: unknown source '{source}'")
        zone_id = str(payload.get("zoneId", ""))
        if zone_id and zone_id != "unzoned" and zone_id not in zone_ids:
            errors.append(f"line {line_no}: unknown zoneId '{zone_id}'")
    return errors


def parse_iso_utc(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def compute_zone_escape_stats(
    escape_entries: list[EscapeEntry],
    hunt_entries: list[dict],
    zone_id: str,
    now_utc: datetime,
) -> tuple[int, float]:
    cutoff = now_utc.timestamp() - (90 * 24 * 60 * 60)
    escape_count = 0
    for entry in escape_entries:
        if entry.zone_id != zone_id:
            continue
        if parse_iso_utc(entry.at).timestamp() < cutoff:
            continue
        escape_count += 1

    hunt_count = 0
    for entry in hunt_entries:
        if str(entry.get("zoneId", "")) != zone_id:
            continue
        at_raw = entry.get("at")
        if at_raw is None:
            continue
        if parse_iso_utc(str(at_raw)).timestamp() < cutoff:
            continue
        outcome = str(entry.get("outcome", ""))
        if outcome in ("hit", "dry"):
            hunt_count += 1

    denominator = max(1, hunt_count)
    escape_rate = escape_count / denominator
    return escape_count, escape_rate


def read_run_log_entries(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    entries: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            entries.append(payload)
    return entries


def compute_hunted_in_prior_days(
    hunt_entries: list[dict],
    zone_id: str,
    now_utc: datetime,
) -> int:
    last: datetime | None = None
    for entry in hunt_entries:
        if str(entry.get("zoneId", "")) != zone_id:
            continue
        at_raw = entry.get("at")
        if at_raw is None:
            continue
        try:
            at = parse_iso_utc(str(at_raw))
        except ValueError:
            continue
        if last is None or at > last:
            last = at
    if last is None:
        return -1
    delta = now_utc - last
    return max(0, int(delta.total_seconds() // 86400))


def suggest_zone_for_paths(ledger_text: str, paths: list[str]) -> str:
    matches = map_paths_to_zone_ids(ledger_text, paths)
    if not matches:
        return "unzoned"
    if len(matches) == 1:
        return matches[0]
    return matches[0]
