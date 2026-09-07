#!/usr/bin/env python3
"""Shared parser helpers for AL_BUG_HUNT_LEDGER.md (audit, verifier, escape mapper)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_LEDGER_PATH = REPO_ROOT / "docs/library/AL_BUG_HUNT_LEDGER.md"

ZONE_HEADER = re.compile(r"^## Zone:\s+(.+)$", re.MULTILINE)
FIELD_ID = re.compile(r"^\s*-\s+\*\*id:\*\*\s+(.+?)\s*$", re.MULTILINE)
FIELD_PATHS = re.compile(r"^\s*-\s+\*\*paths:\*\*\s+(.+?)\s*$", re.MULTILINE)
PROVEN_LINE = re.compile(r"^\s*-\s+\[[xX]\]\s+(\(proven\)\s+)?(.+)$", re.MULTILINE)
DEFECT_CLASS_TAG = re.compile(r"\[class:([a-z0-9-]+)\]", re.IGNORECASE)

DEFECT_CLASSES: tuple[str, ...] = (
    "fail-open-validation",
    "boolean-coercion",
    "strictmode-script",
    "state-machine-gap",
    "null-deref",
    "off-by-one",
    "authz-scope",
    "other",
)


@dataclass(frozen=True)
class ProvenRow:
    zone_id: str
    text: str


@dataclass(frozen=True)
class ZonePaths:
    zone_id: str
    paths: tuple[str, ...]


def parse_zones(ledger_text: str) -> dict[str, str]:
    zones: dict[str, str] = {}
    parts = re.split(r"(?m)^## Zone:", ledger_text)
    for part in parts:
        if "**id:**" not in part:
            continue
        id_match = FIELD_ID.search(part)
        if not id_match:
            continue
        zones[id_match.group(1).strip()] = part
    return zones


def parse_zone_paths(ledger_text: str) -> list[ZonePaths]:
    zones = parse_zones(ledger_text)
    result: list[ZonePaths] = []
    for zone_id, body in zones.items():
        paths_match = FIELD_PATHS.search(body)
        if not paths_match:
            result.append(ZonePaths(zone_id=zone_id, paths=()))
            continue
        raw = paths_match.group(1).strip()
        paths = tuple(
            segment.strip()
            for segment in raw.split(";")
            if segment.strip()
        )
        result.append(ZonePaths(zone_id=zone_id, paths=paths))
    return result


def collect_proven_rows(ledger_text: str) -> list[ProvenRow]:
    zones = parse_zones(ledger_text)
    rows: list[ProvenRow] = []
    for zone_id, body in zones.items():
        for match in PROVEN_LINE.finditer(body):
            text = match.group(2).strip()
            if "(proven)" in match.group(0).lower() or match.group(1):
                rows.append(ProvenRow(zone_id=zone_id, text=text))
            elif "(invalid)" not in text.lower() and "(valid-no-repro)" not in text.lower():
                rows.append(ProvenRow(zone_id=zone_id, text=text))
    return rows


def normalize_defect_class(raw: str | None) -> str | None:
    if raw is None:
        return None
    lowered = raw.strip().lower()
    if not lowered:
        return None
    if lowered in DEFECT_CLASSES:
        return lowered
    return "other"


def extract_defect_class_tag(text: str) -> str | None:
    match = DEFECT_CLASS_TAG.search(text)
    if not match:
        return None
    return normalize_defect_class(match.group(1))


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip()


def map_paths_to_zone_ids(ledger_text: str, paths: list[str]) -> list[str]:
    zone_paths = parse_zone_paths(ledger_text)
    matched: set[str] = set()
    for path in paths:
        normalized = normalize_path(path)
        if not normalized:
            continue
        for zone in zone_paths:
            for prefix in zone.paths:
                prefix_norm = normalize_path(prefix)
                if not prefix_norm:
                    continue
                if normalized == prefix_norm or normalized.startswith(prefix_norm + "/"):
                    matched.add(zone.zone_id)
                    break
    return sorted(matched)
