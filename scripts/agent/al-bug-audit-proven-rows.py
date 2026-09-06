#!/usr/bin/env python3
"""Sample and classify (proven) rows from AL_BUG_HUNT_LEDGER.md."""

from __future__ import annotations

import argparse
import random
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER_PATH = REPO_ROOT / "docs/library/AL_BUG_HUNT_LEDGER.md"
REPORT_PATH = REPO_ROOT / "docs/library/AL_BUG_HUNT_VALIDITY_AUDIT.md"

ZONE_HEADER = re.compile(r"^## Zone:\s+(.+)$", re.MULTILINE)
FIELD_ID = re.compile(r"^\s*-\s+\*\*id:\*\*\s+(.+?)\s*$", re.MULTILINE)
PROVEN_LINE = re.compile(r"^\s*-\s+\[[xX]\]\s+(\(proven\)\s+)?(.+)$", re.MULTILINE)


@dataclass(frozen=True)
class ProvenRow:
    zone_id: str
    text: str


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


def collect_proven_rows(ledger_text: str) -> list[ProvenRow]:
    zones = parse_zones(ledger_text)
    rows: list[ProvenRow] = []
    for zone_id, body in zones.items():
        for match in PROVEN_LINE.finditer(body):
            text = match.group(2).strip()
            if "(proven)" in match.group(0).lower() or match.group(1):
                rows.append(ProvenRow(zone_id=zone_id, text=text))
            elif "(invalid)" not in text.lower() and "(valid-no-repro)" not in text.lower():
                # Bare [x] counts as proven per ledger rules.
                rows.append(ProvenRow(zone_id=zone_id, text=text))
    return rows


def classify_row(text: str) -> str:
    lowered = text.lower()

    if any(
        token in lowered
        for token in (
            "accesskey",
            "passwordless",
            "beefaccesskey",
            "caseaccesskey",
            "cashaccesskey",
            "castaccesskey",
            "izer suffix",
            "less suffix",
            "free suffix",
        )
    ):
        return "synthetic-redaction"

    if any(
        token in lowered
        for token in (
            "mightn't",
            "needn't",
            "configure to",
            "mandate to",
            "apply to",
            "enforce to",
            "provision to",
            "doesn't configure",
            "doesn't mandate",
        )
    ):
        return "synthetic-negation"

    if "schemaversion" in lowered and any(
        token in lowered for token in ("boolean", '"on"', '"off"', "synonym", "true schema")
    ):
        return "synthetic-coercion"

    if "parity" in lowered and any(
        token in lowered for token in ("sibling", "on synonym", "boolean")
    ):
        return "synthetic-parity"

    if any(
        token in lowered
        for token in (
            "cross-tenant",
            "zip-slip",
            "idor",
            "adminpassword",
            "connectionstring",
            "scope gate",
            "returns 200",
            "foreign workspace",
        )
    ):
        return "realistic"

    return "unclear"


def stratified_sample(rows: list[ProvenRow], seed: int) -> list[ProvenRow]:
    rng = random.Random(seed)
    by_zone: dict[str, list[ProvenRow]] = {}
    for row in rows:
        by_zone.setdefault(row.zone_id, []).append(row)

    sample: list[ProvenRow] = []

    def take(zone_id: str, limit: int) -> None:
        pool = by_zone.get(zone_id, [])
        if not pool:
            return
        if len(pool) <= limit:
            sample.extend(pool)
            return
        sample.extend(rng.sample(pool, limit))

    take("archlucid-core", 50)
    take("api-governance-tenancy-controllers", 25)

    others = [r for r in rows if r.zone_id not in ("archlucid-core", "api-governance-tenancy-controllers")]
    if len(others) <= 25:
        sample.extend(others)
    else:
        sample.extend(rng.sample(others, 25))

    return sample


def render_report(sample: list[ProvenRow], seed: int, total_proven: int) -> str:
    classes = Counter(classify_row(row.text) for row in sample)
    by_zone = Counter(row.zone_id for row in sample)
    synthetic = sum(
        classes.get(key, 0)
        for key in (
            "synthetic-redaction",
            "synthetic-negation",
            "synthetic-coercion",
            "synthetic-parity",
        )
    )
    synthetic_fraction = synthetic / len(sample) if sample else 0.0

    lines = [
        "> **Scope:** Contributor-reference — validity audit of `(proven)` hunt hypotheses. Not a buyer or operator document.",
        "",
        "# `/al-bug` proven-row validity audit",
        "",
        f"**Sample size:** {len(sample)} rows (of {total_proven} tagged proven in ledger)",
        f"**RNG seed:** {seed}",
        "",
        "## Class totals (heuristic)",
        "",
        "| Class | Count |",
        "| --- | ---: |",
    ]

    for key in sorted(classes.keys()):
        lines.append(f"| {key} | {classes[key]} |")

    lines.extend(
        [
            "",
            f"**Estimated synthetic fraction (sample):** {synthetic_fraction:.0%}",
            "",
            "## By zone (sample)",
            "",
            "| Zone | Count |",
            "| --- | ---: |",
        ]
    )

    for zone_id, count in by_zone.most_common():
        lines.append(f"| {zone_id} | {count} |")

    lines.extend(
        [
            "",
            "## Evidence note (2026-09-06)",
            "",
            "ABQ-01/02 redactor probe: fictional keys like `beefAccessKey` were redacted while real ARM keys such as `adminPassword` and `storageAccountAccessKey` were not — synthetic redaction hunts masked a fail-open defect class.",
            "",
            "## Unclear rows (owner review)",
            "",
        ]
    )

    unclear = [row for row in sample if classify_row(row.text) == "unclear"][:10]
    for row in unclear:
        lines.append(f"- `{row.zone_id}`: {row.text[:200]}{'…' if len(row.text) > 200 else ''}")

    if not unclear:
        lines.append("- (none in sample)")

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=20260906)
    parser.add_argument("--preview", action="store_true", help="Print report only; do not write markdown file.")
    args = parser.parse_args()

    ledger_text = LEDGER_PATH.read_text(encoding="utf-8")
    proven_rows = collect_proven_rows(ledger_text)
    sample = stratified_sample(proven_rows, args.seed)
    report = render_report(sample, args.seed, len(proven_rows))

    print(report)

    if not args.preview:
        REPORT_PATH.write_text(report + "\n", encoding="utf-8")
        print(f"\nWrote {REPORT_PATH}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
