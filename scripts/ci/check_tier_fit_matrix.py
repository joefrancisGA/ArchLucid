#!/usr/bin/env python3
"""Validate tier-fit matrix and scan GTM docs for forbidden tier claims (TB-132)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

MATRIX_PATH = Path(__file__).resolve().parent / "data" / "tier_fit_validation_matrix.v1.json"
SCAN_ROOTS = (
    "docs/go-to-market",
    "docs/library",
)


def load_matrix() -> dict[str, object]:
    payload = json.loads(MATRIX_PATH.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("matrix must be an object")

    return payload


def matrix_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not MATRIX_PATH.is_file():
        return ["tier_fit_validation_matrix.v1.json missing"]

    matrix = load_matrix()
    tiers = matrix.get("tiers")

    if not isinstance(tiers, list) or len(tiers) < 3:
        violations.append("matrix must list at least Team, Professional, Enterprise")

    required_tier_ids = {"team", "professional", "enterprise"}
    seen_ids: set[str] = set()

    for index, tier in enumerate(tiers if isinstance(tiers, list) else []):
        if not isinstance(tier, dict):
            violations.append(f"tiers[{index}] must be an object")
            continue

        tier_id = str(tier.get("tierId", "")).strip().lower()

        if not tier_id:
            violations.append(f"tiers[{index}] missing tierId")
            continue

        seen_ids.add(tier_id)

        for key in ("displayName", "buyerJob", "includedProofOutputs", "excludedOrDeferred"):
            if key not in tier or not tier.get(key):
                violations.append(f"{tier_id}: missing {key}")

    if seen_ids != required_tier_ids:
        violations.append(f"expected tier ids {sorted(required_tier_ids)} got {sorted(seen_ids)}")

    forbidden = matrix.get("forbiddenV1Claims") or []

    if not isinstance(forbidden, list) or len(forbidden) == 0:
        violations.append("forbiddenV1Claims must be non-empty")

    for rel_root in SCAN_ROOTS:
        base = root / rel_root

        if not base.is_dir():
            continue

        for path in base.rglob("*.md"):
            if "archive" in path.parts:
                continue

            if path.name in {"PUBLIC_CLAIM_BOUNDARY_GUIDE.md", "AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md"}:
                continue

            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

            for phrase in forbidden:
                if not isinstance(phrase, str):
                    continue

                needle = phrase.lower()

                for index, line in enumerate(lines, start=1):
                    lowered = line.lower()

                    if needle not in lowered:
                        continue

                    if "|" in line and ("prohibited" in lowered or "never imply" in lowered or "say instead" in lowered):
                        continue

                    window_start = max(0, lowered.find(needle) - 40)
                    window = lowered[window_start : lowered.find(needle)]

                    if any(token in window for token in ("not ", "no ", "deferred", "v1.1", "do not", "instead")):
                        continue

                    violations.append(f"{path.relative_to(root)}:{index}: forbidden V1 tier claim {phrase!r}")

    offer_pack = root / "docs" / "go-to-market" / "AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md"

    if not offer_pack.is_file():
        violations.append("missing AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md")

    return violations


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    violations = matrix_violations(root)

    if violations:
        print("Tier fit matrix: FAIL", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Tier fit matrix: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
