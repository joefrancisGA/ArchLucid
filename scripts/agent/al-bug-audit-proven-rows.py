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


# Classification keys on the guard *symbol* a row targets rather than on the offending phrase.
# An earlier revision matched literal phrases ("mightn't", "needn't", ...), which is the same
# open-ended list anti-pattern ABQ-04 deleted from production: every new phrase variant fell
# through to "unclear". That under-reported the treadmill share of the ledger roughly four-fold.
TREADMILL_SIGNALS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "negation-treadmill",
        (
            "isadvicestylenegation",
            "containsmidsentencenegation",
            "issuffixnegatedadvicefragment",
            "containsadvicenegationphrase",
            "negation gap",
            "negation phrase",
            "negated advice",
            "suffix gap",
        ),
    ),
    (
        "redaction-treadmill",
        (
            "redactor",
            "redaction",
            "sensitiveproperty",
            "issensitive",
            "accesskey",
            "passwordless",
        ),
    ),
    (
        "coercion-treadmill",
        (
            "schemaversion",
            "tryparsebooleanstring",
            "boolean synonym",
        ),
    ),
    (
        "parity-treadmill",
        (
            "delimiter variant",
            "delimiter parity",
            "sibling parity",
        ),
    ),
)

# Security/correctness classes that describe a reachable defect rather than a phrase-list gap.
SUBSTANTIVE_SIGNALS: tuple[str, ...] = (
    "cross-tenant",
    "zip-slip",
    "idor",
    "adminpassword",
    "connectionstring",
    "scope gate",
    "returns 200",
    "foreign workspace",
    "privilege",
    "auth bypass",
)

TREADMILL_CLASSES: tuple[str, ...] = tuple(name for name, _ in TREADMILL_SIGNALS)


def classify_row(text: str) -> str:
    lowered = text.lower()

    for class_name, signals in TREADMILL_SIGNALS:
        if any(signal in lowered for signal in signals):
            return class_name

    if any(signal in lowered for signal in SUBSTANTIVE_SIGNALS):
        return "substantive"

    return "unclassified"


def is_treadmill(text: str) -> bool:
    return classify_row(text) in TREADMILL_CLASSES


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


def render_report(rows: list[ProvenRow], sample: list[ProvenRow], seed: int) -> str:
    total = len(rows)
    classes = Counter(classify_row(row.text) for row in rows)
    treadmill = sum(classes.get(key, 0) for key in TREADMILL_CLASSES)
    treadmill_fraction = treadmill / total if total else 0.0

    # Zone totals are reported over every proven row, not the sample, so the table cannot be
    # read as evidence that one zone is clean simply because the sample missed it.
    treadmill_by_zone = Counter(row.zone_id for row in rows if is_treadmill(row.text))

    lines = [
        "> **Scope:** Contributor-reference — validity audit of `(proven)` hunt hypotheses. Not a buyer or operator document.",
        "",
        "# `/al-bug` proven-row validity audit",
        "",
        f"**Population:** all {total} rows tagged proven in the ledger (classified in full, not sampled)",
        f"**RNG seed (examples only):** {seed}",
        "",
        "## Class totals (full population)",
        "",
        "| Class | Count | Share |",
        "| --- | ---: | ---: |",
    ]

    for key, count in classes.most_common():
        lines.append(f"| {key} | {count} | {(count / total if total else 0):.1%} |")

    lines.extend(
        [
            f"| **treadmill total** | **{treadmill}** | **{treadmill_fraction:.1%}** |",
            "",
            f"**Treadmill share of proven rows:** {treadmill_fraction:.1%} ({treadmill} of {total}).",
            "A treadmill row re-proves the same guard against a new surface form, so it inflates",
            "`bugs-found` without retiring a defect class. Scoring must not read these as yield.",
            "",
            "## Treadmill concentration by zone (full population)",
            "",
            "| Zone | Proven rows | Treadmill | Share |",
            "| --- | ---: | ---: | ---: |",
        ]
    )

    proven_by_zone = Counter(row.zone_id for row in rows)

    for zone_id, proven_count in proven_by_zone.most_common(15):
        zone_treadmill = treadmill_by_zone.get(zone_id, 0)
        share = zone_treadmill / proven_count if proven_count else 0.0
        lines.append(f"| {zone_id} | {proven_count} | {zone_treadmill} | {share:.1%} |")

    lines.extend(
        [
            "",
            "## Evidence note (2026-09-06)",
            "",
            "ABQ-01/02 redactor probe: fictional keys like `beefAccessKey` were redacted while real ARM keys such as `adminPassword` and `storageAccountAccessKey` were not — synthetic redaction hunts masked a fail-open defect class.",
            "",
            "## Example rows by class (seeded sample)",
            "",
        ]
    )

    for class_name in (*TREADMILL_CLASSES, "substantive", "unclassified"):
        examples = [row for row in sample if classify_row(row.text) == class_name][:4]

        if not examples:
            continue

        lines.append(f"### {class_name}")
        lines.append("")

        for row in examples:
            lines.append(f"- `{row.zone_id}`: {row.text[:200]}{'…' if len(row.text) > 200 else ''}")

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
    report = render_report(proven_rows, sample, args.seed)

    print(report)

    if not args.preview:
        REPORT_PATH.write_text(report + "\n", encoding="utf-8")
        print(f"\nWrote {REPORT_PATH}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
