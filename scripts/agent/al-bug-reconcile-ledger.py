#!/usr/bin/env python3
"""Rebuild AL_BUG_HUNT_LEDGER.md from canonical master + unique stanzas from other refs."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER = REPO_ROOT / "docs" / "library" / "AL_BUG_HUNT_LEDGER.md"

SCOPE_LINE = (
    "> **Scope:** Contributor-reference — append-only `/al-bug` hunt ledger; "
    "keep this blockquote as the first line and insert new dated notes immediately below it. "
    "Not customer-facing."
)

BASE_REF = "eb93fa59e5"
SUPPLEMENTAL_REFS = ("e341197212", "HEAD")


def load_ref(ref: str) -> str:
    if ref == "HEAD":
        return LEDGER.read_text(encoding="utf-8", errors="replace")
    return subprocess.check_output(
        ["git", "show", f"{ref}:docs/library/AL_BUG_HUNT_LEDGER.md"],
        text=True,
        errors="replace",
    )


def strip_scope_and_bom(text: str) -> str:
    text = text.replace("\ufeff", "")
    lines: list[str] = []
    for line in text.splitlines():
        if line.lstrip("\ufeff").strip() == SCOPE_LINE:
            continue
        lines.append(line)
    return "\n".join(lines)


def split_stanzas(block: str) -> list[str]:
    block = block.strip("\n")
    if not block:
        return []

    stanzas: list[str] = []
    current: list[str] = []

    def flush() -> None:
        nonlocal current
        if current:
            joined = "\n".join(current).strip()
            if joined:
                stanzas.append(joined)
        current = []

    for line in block.splitlines():
        if re.match(r"^\d{4}-\d{2}-\d{2}\b", line) or re.match(r"^- \*\*id:\*\*", line):
            flush()
            current = [line]
        else:
            current.append(line)

    flush()
    return stanzas


def norm_stanza(stanza: str) -> str:
    return re.sub(r"\s+", " ", stanza.strip())


def parse_supplemental(text: str) -> tuple[list[str], dict[str, list[str]], list[str]]:
    cleaned = strip_scope_and_bom(text)
    zone_order: list[str] = []
    for match in re.finditer(r"(?m)^## Zone: (.+)$", cleaned):
        zone_id = match.group(1).strip()
        if zone_id not in zone_order:
            zone_order.append(zone_id)

    parts = re.split(r"(?m)^## Zone: ", cleaned)
    preamble = split_stanzas(parts[0])
    zones: dict[str, list[str]] = {}
    for chunk in parts[1:]:
        zone_id, rest = chunk.split("\n", 1)
        zone_id = zone_id.strip()
        body = re.sub(r"\n---\s*$", "", rest.strip("\n"))
        zones.setdefault(zone_id, []).extend(split_stanzas(body))

    return preamble, zones, zone_order


def known_keys_from_text(text: str) -> set[str]:
    preamble, zones, _ = parse_supplemental(text)
    keys = {norm_stanza(s) for s in preamble}
    for stanzas in zones.values():
        for stanza in stanzas:
            keys.add(norm_stanza(stanza))
    return keys


def insert_after_scope(base: str, stanzas: list[str]) -> str:
    if not stanzas:
        return base
    block = "\n\n".join(stanzas) + "\n\n"
    lines = base.splitlines(keepends=True)
    if not lines:
        return block
    # Scope is line 0; insert after first line (and following blank line if present).
    insert_at = 1
    if len(lines) > 1 and lines[1].strip() == "":
        insert_at = 2
    return "".join(lines[:insert_at]) + block + "".join(lines[insert_at:])


def insert_after_zone_header(base: str, zone_id: str, stanzas: list[str]) -> str:
    if not stanzas:
        return base
    block = "\n\n".join(stanzas) + "\n\n"
    pattern = rf"(?m)^## Zone: {re.escape(zone_id)}\s*\n"
    match = re.search(pattern, base)
    if not match:
        return base
    pos = match.end()
    return base[:pos] + block + base[pos:]


def append_new_zone(base: str, zone_id: str, stanzas: list[str]) -> str:
    block = f"## Zone: {zone_id}\n\n" + "\n\n".join(stanzas) + "\n\n---\n"
    return base.rstrip() + "\n\n" + block + "\n"


def rebuild() -> str:
    base = load_ref(BASE_REF).replace("\ufeff", "")
    if base.count(SCOPE_LINE) != 1:
        base = strip_scope_and_bom(base)
        base = SCOPE_LINE + "\n\n" + base.lstrip("\n")

    known = known_keys_from_text(base)

    extra_preamble: list[str] = []
    extra_zones: dict[str, list[str]] = {}
    extra_zone_order: list[str] = []

    for ref in SUPPLEMENTAL_REFS:
        preamble, zones, zone_order = parse_supplemental(load_ref(ref))
        for stanza in preamble:
            key = norm_stanza(stanza)
            if key in known:
                continue
            known.add(key)
            extra_preamble.append(stanza)

        for zone_id in zone_order:
            if zone_id not in extra_zone_order:
                extra_zone_order.append(zone_id)
            for stanza in zones.get(zone_id, []):
                key = norm_stanza(stanza)
                if key in known:
                    continue
                known.add(key)
                extra_zones.setdefault(zone_id, []).append(stanza)

    out = insert_after_scope(base, extra_preamble)
    for zone_id in extra_zone_order:
        stanzas = extra_zones.get(zone_id, [])
        if not stanzas:
            continue
        if re.search(rf"(?m)^## Zone: {re.escape(zone_id)}\s*$", out):
            out = insert_after_zone_header(out, zone_id, stanzas)
        else:
            out = append_new_zone(out, zone_id, stanzas)

    if out.count(SCOPE_LINE) != 1:
        raise AssertionError(f"expected one scope line, found {out.count(SCOPE_LINE)}")
    return out if out.endswith("\n") else out + "\n"


def stanza_present(stanza: str, keys: set[str], rebuilt: str) -> bool:
    if norm_stanza(stanza) in keys:
        return True
    stripped = stanza.strip()
    if not stripped:
        return True
    return stripped in rebuilt


def verify(rebuilt: str) -> None:
    keys = known_keys_from_text(rebuilt)
    preamble, zones, _ = parse_supplemental(load_ref(BASE_REF))
    missing = []
    for stanza in preamble:
        if not stanza_present(stanza, keys, rebuilt):
            missing.append(stanza[:80])
    for zone_stanzas in zones.values():
        for stanza in zone_stanzas:
            if not stanza_present(stanza, keys, rebuilt):
                missing.append(stanza[:80])
    if missing:
        raise AssertionError(f"{BASE_REF}: {len(missing)} stanzas missing; first: {missing[0]}")


def verify_supplemental_captured(head_text: str, rebuilt: str) -> None:
    base_keys = known_keys_from_text(load_ref(BASE_REF))
    rebuilt_keys = known_keys_from_text(rebuilt)
    merged_keys = base_keys | rebuilt_keys
    for ref in SUPPLEMENTAL_REFS:
        text = head_text if ref == "HEAD" else load_ref(ref)
        preamble, zones, _ = parse_supplemental(text)
        for stanza in preamble:
            if not stanza_present(stanza, merged_keys, rebuilt):
                raise AssertionError(f"{ref}: supplemental preamble stanza not captured")
        for zone_stanzas in zones.values():
            for stanza in zone_stanzas:
                if not stanza_present(stanza, merged_keys, rebuilt):
                    raise AssertionError(f"{ref}: supplemental zone stanza not captured")


def main() -> int:
    head_before = load_ref("HEAD")
    rebuilt = rebuild()
    verify(rebuilt)
    verify_supplemental_captured(head_before, rebuilt)
    LEDGER.write_text(rebuilt, encoding="utf-8")
    lines = rebuilt.count("\n") + 1
    zones = len(re.findall(r"(?m)^## Zone: ", rebuilt))
    print(f"Rebuilt ledger: {lines} lines, {zones} zones, scope headers: {rebuilt.count(SCOPE_LINE)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
