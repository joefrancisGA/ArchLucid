#!/usr/bin/env python3
"""Classify /al-bug hunt outcomes for SecureNow vs ArchLucid + shared libraries."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_ledger import DEFAULT_LEDGER_PATH, parse_zone_paths  # noqa: E402

PRODUCT_SECURENOW = "securenow"
PRODUCT_ARCHLUCID_SHARED = "archlucid-shared"

# Ledger zones that are primarily SecureNow even when path heuristics are ambiguous.
_ZONE_PRODUCT_OVERRIDES: dict[str, str] = {
    "host-infra-evidence-composition": PRODUCT_SECURENOW,
    "ui-infra-resource-hub": PRODUCT_SECURENOW,
    "ui-governance-findings-queue": PRODUCT_SECURENOW,
}

# Path substrings (normalized lowercase) that indicate SecureNow-primary loci.
_SECURENOW_PATH_MARKERS: tuple[str, ...] = (
    "securenow",
    "/app/(security)/",
    "/security/remediation",
    "/governance/infrastructure/",
    "governance/findings/governancefindings",
    "remediation-factory",
    "remediation-pattern",
    "remediationfactory",
    "remediationpattern",
    "infraevidence",
    "get-securenowazurepackage",
    "run-securenowazureextractor",
    "product-line/securenow",
    "securenow-architect",
    "securenow-governance",
    "securenow-infrastructure",
    "securenow-path",
    "securenow-home",
    "declared-connections",
    "diagram-reconcile",
    "audit-evidence",
    "policy-packs",
)


def _normalize_path(value: str) -> str:
    return value.replace("\\", "/").strip().lower()


def path_indicates_securenow(path: str) -> bool:
    normalized = _normalize_path(path)
    if not normalized:
        return False
    compact = re.sub(r"[^a-z0-9/._-]+", "", normalized)
    for marker in _SECURENOW_PATH_MARKERS:
        if marker in normalized or marker in compact:
            return True
    return False


def classify_paths(paths: tuple[str, ...] | list[str]) -> str:
    for path in paths:
        if path_indicates_securenow(path):
            return PRODUCT_SECURENOW
    return PRODUCT_ARCHLUCID_SHARED


def classify_hunt(
    zone_id: str,
    *,
    paths: tuple[str, ...] | list[str] | None = None,
    product_line: str | None = None,
    zone_paths: dict[str, tuple[str, ...]] | None = None,
) -> str:
    if product_line:
        lowered = product_line.strip().lower()
        if lowered in (PRODUCT_SECURENOW, "security"):
            return PRODUCT_SECURENOW
        if lowered in (PRODUCT_ARCHLUCID_SHARED, "architecture", "archlucid", "shared"):
            return PRODUCT_ARCHLUCID_SHARED

    override = _ZONE_PRODUCT_OVERRIDES.get(zone_id.strip())
    if override:
        return override

    candidate_paths: list[str] = []
    if paths:
        candidate_paths.extend(paths)
    if zone_paths and zone_id in zone_paths:
        candidate_paths.extend(zone_paths[zone_id])

    if candidate_paths:
        return classify_paths(candidate_paths)

    return PRODUCT_ARCHLUCID_SHARED


def build_zone_path_map(ledger_path: Path) -> dict[str, tuple[str, ...]]:
    text = ledger_path.read_text(encoding="utf-8")
    return {zone.zone_id: zone.paths for zone in parse_zone_paths(text)}


def build_zone_product_map(ledger_path: Path) -> dict[str, str]:
    zone_paths = build_zone_path_map(ledger_path)
    return {
        zone_id: classify_hunt(zone_id, paths=paths, zone_paths=zone_paths)
        for zone_id, paths in zone_paths.items()
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    parser.add_argument("--zone-map", action="store_true", help="Print zoneId -> productLine JSON.")
    parser.add_argument("--classify", action="store_true")
    parser.add_argument("--zone-id", default="")
    parser.add_argument("--paths", default="", help="Comma-separated hunt paths.")
    parser.add_argument("--product-line", default="")
    args = parser.parse_args()

    if args.zone_map:
        print(json.dumps(build_zone_product_map(args.ledger), separators=(",", ":")))
        return 0

    if args.classify:
        zone_paths = build_zone_path_map(args.ledger)
        paths = tuple(segment.strip() for segment in args.paths.split(",") if segment.strip())
        product = classify_hunt(
            args.zone_id,
            paths=paths,
            product_line=args.product_line or None,
            zone_paths=zone_paths,
        )
        print(product)
        return 0

    parser.error("Specify --zone-map or --classify.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
