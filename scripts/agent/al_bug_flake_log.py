#!/usr/bin/env python3
"""Flake log helpers (ABQ-31). Separate from the escape log and hunt run log."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from al_bug_escape_log import parse_iso_utc
from al_bug_ledger import map_paths_to_zone_ids, parse_zones

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_FLAKE_LOG_PATH = REPO_ROOT / "docs/library/AL_BUG_FLAKE_LOG.jsonl"

REQUIRED_FIELDS = ("at", "test", "job", "ref", "paths", "zoneId", "attempts")


@dataclass(frozen=True)
class FlakeEntry:
    at: str
    test: str
    job: str
    ref: str
    paths: tuple[str, ...]
    zone_id: str
    attempts: int


def read_flake_log(path: Path) -> list[FlakeEntry]:
    if not path.is_file():
        return []
    entries: list[FlakeEntry] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON on line {line_no} of {path}: {exc}") from exc
        entries.append(
            FlakeEntry(
                at=str(payload["at"]),
                test=str(payload["test"]),
                job=str(payload["job"]),
                ref=str(payload["ref"]),
                paths=tuple(str(p) for p in payload.get("paths", [])),
                zone_id=str(payload["zoneId"]),
                attempts=int(payload["attempts"]),
            )
        )
    return entries


def validate_flake_log(path: Path, ledger_text: str) -> list[str]:
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
        for key in REQUIRED_FIELDS:
            if key not in payload:
                errors.append(f"line {line_no}: missing required field '{key}'")
        zone_id = str(payload.get("zoneId", ""))
        if zone_id and zone_id != "unzoned" and zone_id not in zone_ids:
            errors.append(f"line {line_no}: unknown zoneId '{zone_id}'")
        attempts = payload.get("attempts")
        if attempts is not None:
            try:
                if int(attempts) < 2:
                    errors.append(f"line {line_no}: attempts must be >= 2")
            except (TypeError, ValueError):
                errors.append(f"line {line_no}: attempts must be an integer")
    return errors


def flake_defect_class(test_name: str, paths: tuple[str, ...]) -> str:
    blob = " ".join((test_name,) + paths).lower()
    if any(token in blob for token in ("idempoten", "concurren", "race", "retry", "commit")):
        return "state-machine-gap"
    return "other"


def seed_candidates(
    entries: list[FlakeEntry],
    now_utc: datetime,
    existing_open: list[str] | None = None,
    cap: int = 15,
) -> list[str]:
    cutoff = now_utc - timedelta(days=30)
    counts: dict[str, list[FlakeEntry]] = {}
    for entry in entries:
        try:
            at = parse_iso_utc(entry.at)
        except ValueError:
            continue
        if at < cutoff:
            continue
        counts.setdefault(entry.test, []).append(entry)

    existing = existing_open or []
    lines: list[str] = []
    for test_name, hits in sorted(counts.items(), key=lambda item: (-len(item[1]), item[0])):
        if len(lines) >= cap:
            break
        if len(hits) < 3:
            continue
        if any(test_name in row for row in existing):
            continue
        latest = hits[-1]
        class_id = flake_defect_class(test_name, latest.paths)
        lines.append(
            f"(candidate) flake {test_name} (≥3/30d) — race/retry locus [class:{class_id}]"
        )
    return lines


def suggest_flake_zone(ledger_text: str, paths: list[str]) -> str:
    matches = map_paths_to_zone_ids(ledger_text, paths)
    if not matches:
        return "unzoned"
    return matches[0]
