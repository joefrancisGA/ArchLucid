#!/usr/bin/env python3
"""Validate SecureNow procurement pack markdown (index, brief, overlay, wave-2 exhibits).

Run from repo root: python scripts/ci/check_securenow_procurement_pack.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

INDEX = ROOT / "docs/securenow/PROCUREMENT_PACK_INDEX.md"
ONE_PAGER = ROOT / "docs/securenow/BUYER_SECURITY_ONE_PAGER.md"
OVERLAY = ROOT / "docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md"
SCHEDULE = ROOT / "docs/securenow/DATA_PROCESSING_SCHEDULE.md"
SUBPROCESSORS_DELTA = ROOT / "docs/securenow/SUBPROCESSORS_DELTA.md"
CROSSWALK = ROOT / "docs/securenow/QUESTIONNAIRE_CROSSWALK.md"
QUOTE_COVER = ROOT / "docs/securenow/QUOTE_COVER.md"

PACK_MARKDOWN = (
    INDEX,
    ONE_PAGER,
    OVERLAY,
    SCHEDULE,
    SUBPROCESSORS_DELTA,
    CROSSWALK,
    QUOTE_COVER,
)
WAVE2_MARKDOWN = (SCHEDULE, SUBPROCESSORS_DELTA, CROSSWALK, QUOTE_COVER)

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
STATUS_MAP_HEADING = "## Procurement artifact status map (buyer-safe classification)"
STATUS_MAP_STATUSES = frozenset(
    {
        "Implemented",
        "Self-attested",
        "Template",
        "Deferred",
        "Not applicable",
        "External/NDA-gated",
    },
)
EVIDENCE_TYPES = frozenset(
    {"Implemented", "Self-asserted", "In flight", "Deferred V1.1"},
)
FORBIDDEN_PHRASES = (
    "SOC 2 certified",
    "SOC 2 Type II issued",
    "ISO 27001 certified",
    "third-party penetration test completed",
    "guaranteed ROI",
    "guaranteed savings",
    "guaranteed breach prevention",
    "autonomous remediation",
    "observed exploit",
)
DENIAL_RE = re.compile(
    r"\b(?:do\s+not|does\s+not|don't|never|not\s+a|not\s+an|no\s+cpa|without)\b",
    re.I,
)

ONE_PAGER_TOKENS = (
    "NOT AN APPROVED",
    "NO_GO",
    "outside",
    "NOT VERIFIED",
    "SOC 2",
)


def _resolve_link(base: Path, target: str) -> Path:
    path_part = target.split("#", 1)[0]
    return (base.parent / path_part).resolve()


def _check_links(text: str, base: Path, label: str, errors: list[str]) -> None:
    for match in LINK_RE.finditer(text):
        target = match.group(1)
        if target.startswith("http"):
            continue
        if not target.split("#", 1)[0]:
            continue
        resolved = _resolve_link(base, target)
        if not resolved.is_file():
            errors.append(f"{label}: broken link {target!r}")


STATUS_MAP_HEADER = [
    "Procurement Artifact",
    "Status",
    "Source File",
    "Notes",
]


def _parse_status_map_rows(text: str) -> list[list[str]]:
    start = text.find(STATUS_MAP_HEADING)
    if start < 0:
        return []
    rows: list[list[str]] = []
    in_table = False
    for raw_line in text[start:].splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("## ") and stripped != STATUS_MAP_HEADING.strip():
            if in_table:
                break
            continue
        if stripped.startswith("###"):
            continue
        if not stripped.startswith("|"):
            if in_table and rows and not stripped:
                in_table = False
            continue
        if "---" in stripped.replace(" ", ""):
            in_table = True
            continue
        parts = [p.strip() for p in stripped.strip("|").split("|")]
        if len(parts) > 4:
            if in_table and rows:
                break
            continue
        if len(parts) < 4:
            continue
        if parts[0] == STATUS_MAP_HEADER[0] and parts[1] == STATUS_MAP_HEADER[1]:
            in_table = True
            continue
        if parts[0] == "Evidence Artifact":
            break
        if in_table:
            rows.append(parts[:4])
    return rows


def _parse_evidence_rows(text: str) -> list[list[str]]:
    rows: list[list[str]] = []
    search_from = 0
    while True:
        header_idx = text.find("| Evidence Artifact |", search_from)
        if header_idx < 0:
            break
        search_from = header_idx + 1
        for raw_line in text[header_idx:].splitlines():
            line = raw_line.strip()
            if not line.startswith("|"):
                if rows and raw_line.startswith("## "):
                    break
                if rows and not line:
                    continue
                if rows:
                    break
                continue
            if "---" in line.replace(" ", ""):
                continue
            parts = [p.strip() for p in line.strip("|").split("|")]
            if len(parts) >= 5 and parts[0] != "Evidence Artifact":
                rows.append(parts[:5])
            elif parts[0] == "Evidence Artifact":
                continue
        # Continue search for platform-shared evidence table after this block.
    return rows


def _forbidden_line_errors(text: str, label: str) -> list[str]:
    errors: list[str] = []
    for line_no, line in enumerate(text.splitlines(), 1):
        lower = line.casefold()
        for phrase in FORBIDDEN_PHRASES:
            if phrase.casefold() in lower and not DENIAL_RE.search(line):
                errors.append(
                    f"{label}:{line_no}: forbidden phrase {phrase!r} without denial on same line",
                )
    return errors


def _count_table_data_rows(text: str, header_prefix: str) -> int:
    count = 0
    in_block = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith(header_prefix):
            in_block = True
            continue
        if not in_block:
            continue
        if not line.startswith("|"):
            if count:
                break
            continue
        if "---" in line.replace(" ", ""):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if parts and parts[0] in ("Theme", "Register row"):
            continue
        if parts:
            count += 1
    return count


def _wave2_content_checks(root: Path, errors: list[str]) -> None:
    schedule_path = root / "docs/securenow/DATA_PROCESSING_SCHEDULE.md"
    delta_path = root / "docs/securenow/SUBPROCESSORS_DELTA.md"
    crosswalk_path = root / "docs/securenow/QUESTIONNAIRE_CROSSWALK.md"
    cover_path = root / "docs/securenow/QUOTE_COVER.md"

    schedule_text = schedule_path.read_text(encoding="utf-8")
    if "TO BE NEGOTIATED" not in schedule_text:
        errors.append("schedule: missing TO BE NEGOTIATED")
    if "90 days" not in schedule_text:
        errors.append("schedule: missing platform template 90 days reference")
    if "0104" not in schedule_text:
        errors.append("schedule: missing ADR 0104 reference")

    delta_text = delta_path.read_text(encoding="utf-8")
    if "SUBPROCESSORS.md" not in delta_text:
        errors.append("subprocessors_delta: must reference SUBPROCESSORS.md")
    if "Not offered" not in delta_text:
        errors.append("subprocessors_delta: missing Not offered row")

    crosswalk_text = crosswalk_path.read_text(encoding="utf-8")
    if "Not a completed SIG" not in crosswalk_text:
        errors.append("crosswalk: missing Not a completed SIG scope statement")
    crosswalk_rows = _count_table_data_rows(crosswalk_text, "| Theme |")
    if crosswalk_rows < 24:
        errors.append(f"crosswalk: expected at least 24 data rows, found {crosswalk_rows}")

    cover_text = cover_path.read_text(encoding="utf-8")
    for token in ("SN-EVAL", "NOT AN APPROVED", "HOLD_NO_PUBLICATION"):
        if token not in cover_text:
            errors.append(f"quote_cover: missing token {token!r}")
    if "$" in cover_text:
        errors.append("quote_cover: must not contain dollar amounts")

    for rel_path in (
        "docs/securenow/DATA_PROCESSING_SCHEDULE.md",
        "docs/securenow/SUBPROCESSORS_DELTA.md",
        "docs/securenow/QUESTIONNAIRE_CROSSWALK.md",
        "docs/securenow/QUOTE_COVER.md",
    ):
        path = root / rel_path
        text = path.read_text(encoding="utf-8")
        _check_links(text, path, rel_path.replace("/", "_"), errors)


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    pack_paths = [
        root / "docs/securenow/PROCUREMENT_PACK_INDEX.md",
        root / "docs/securenow/BUYER_SECURITY_ONE_PAGER.md",
        root / "docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md",
        root / "docs/securenow/DATA_PROCESSING_SCHEDULE.md",
        root / "docs/securenow/SUBPROCESSORS_DELTA.md",
        root / "docs/securenow/QUESTIONNAIRE_CROSSWALK.md",
        root / "docs/securenow/QUOTE_COVER.md",
    ]
    for path in pack_paths:
        if not path.is_file():
            errors.append(f"missing {path.relative_to(root)}")
    if errors:
        return errors

    index_path = pack_paths[0]
    one_pager_path = pack_paths[1]
    overlay_path = pack_paths[2]

    index_text = index_path.read_text(encoding="utf-8")
    one_pager_text = one_pager_path.read_text(encoding="utf-8")
    overlay_text = overlay_path.read_text(encoding="utf-8")
    wave2_bodies = {
        "schedule": (root / "docs/securenow/DATA_PROCESSING_SCHEDULE.md").read_text(encoding="utf-8"),
        "subprocessors_delta": (root / "docs/securenow/SUBPROCESSORS_DELTA.md").read_text(encoding="utf-8"),
        "crosswalk": (root / "docs/securenow/QUESTIONNAIRE_CROSSWALK.md").read_text(encoding="utf-8"),
        "quote_cover": (root / "docs/securenow/QUOTE_COVER.md").read_text(encoding="utf-8"),
    }

    if STATUS_MAP_HEADING not in index_text:
        errors.append(f"index: missing heading {STATUS_MAP_HEADING!r}")
    if "| Evidence Artifact |" not in index_text:
        errors.append("index: missing evidence artifact table header")

    for row in _parse_status_map_rows(index_text):
        status = row[1]
        notes = row[3]
        if status not in STATUS_MAP_STATUSES:
            errors.append(f"index status map: invalid status {status!r} on {row[0]!r}")
        if status == "Deferred" and "V1_DEFERRED" not in notes:
            errors.append(f"index status map: Deferred row {row[0]!r} must cite V1_DEFERRED in Notes")

    for row in _parse_evidence_rows(index_text):
        evidence_type = row[1]
        if evidence_type not in EVIDENCE_TYPES:
            errors.append(f"index evidence: invalid type {evidence_type!r} on {row[0]!r}")

    _check_links(index_text, index_path, "index", errors)
    _check_links(one_pager_text, one_pager_path, "one_pager", errors)
    _check_links(overlay_text, overlay_path, "overlay", errors)

    one_lower = one_pager_text.casefold()
    for token in ONE_PAGER_TOKENS:
        if token.casefold() not in one_lower:
            errors.append(f"one_pager: missing token {token!r}")

    overlay_rows = [
        r
        for r in overlay_text.splitlines()
        if r.strip().startswith("|") and "---" not in r.replace(" ", "")
        and not r.strip().startswith("| Theme |")
    ]
    if len(overlay_rows) < 18:
        errors.append(f"overlay: expected at least 18 data rows, found {len(overlay_rows)}")
    if "PROCUREMENT_PACK_INDEX.md" not in overlay_text and "CONTROLLED_PILOT_OFFER.md" not in overlay_text:
        errors.append("overlay: must link PROCUREMENT_PACK_INDEX.md or CONTROLLED_PILOT_OFFER.md")

    for label, body in (
        ("index", index_text),
        ("one_pager", one_pager_text),
        ("overlay", overlay_text),
        *wave2_bodies.items(),
    ):
        errors.extend(_forbidden_line_errors(body, label))

    _wave2_content_checks(root, errors)

    return errors


def main() -> int:
    errors = validate()
    for err in errors:
        print(err)
    if errors:
        return 1
    print("SecureNow procurement pack: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
