#!/usr/bin/env python3
"""Validate curated commercial tier fixtures against route registry + operator nav hrefs.

See docs/library/PRODUCT_PACKAGING.md (Contributor drift guard) and
scripts/ci/data/commercial_tier_drift_fixtures.json.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from assert_route_tier_policy_nav import load_registry, parse_nav_hrefs, repo_root


def fixtures_path(root: Path) -> Path:
    return root / "scripts" / "ci" / "data" / "commercial_tier_drift_fixtures.json"


def load_fixtures(root: Path) -> list[dict]:
    data = json.loads(fixtures_path(root).read_text(encoding="utf-8"))
    fixtures = data.get("fixtures")

    if not isinstance(fixtures, list):
        raise ValueError("commercial_tier_drift_fixtures.json: 'fixtures' must be a list")

    return fixtures


def run_check(root: Path) -> list[str]:
    errors: list[str] = []
    registry = load_registry(root)
    entries = registry.get("entries")

    if not isinstance(entries, list):
        return ["registry: 'entries' must be a list"]

    by_file: dict[str, dict] = {}

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        controller_file = entry.get("controller_file")

        if isinstance(controller_file, str):
            by_file[controller_file] = entry

    nav_hrefs = parse_nav_hrefs(root / "archlucid-ui" / "src" / "lib")

    for fixture in load_fixtures(root):
        label = fixture.get("label", "fixture")
        controller_file = fixture.get("controller_file")

        if not isinstance(controller_file, str) or not controller_file:
            errors.append(f"{label}: missing controller_file")
            continue

        registry_row = by_file.get(controller_file)

        if registry_row is None:
            errors.append(f"{label}: no registry row for {controller_file}")
            continue

        exp_tier = (fixture.get("expected_commercial_tier") or "none").lower()
        act_tier = (registry_row.get("commercial_tier") or "none").lower()

        if exp_tier != act_tier:
            errors.append(
                f"{label}: commercial_tier fixture expects {exp_tier!r} but registry has {act_tier!r} "
                f"({controller_file})"
            )

        exp_policy = fixture.get("expected_class_policy")

        if isinstance(exp_policy, str) and registry_row.get("class_policy") != exp_policy:
            errors.append(
                f"{label}: class_policy fixture expects {exp_policy!r} but registry has "
                f"{registry_row.get('class_policy')!r}"
            )

        exp_nav = fixture.get("expected_nav_operator_href")

        if exp_nav is not None:
            reg_nav = registry_row.get("nav_operator_href")

            if reg_nav != exp_nav:
                errors.append(
                    f"{label}: nav_operator_href fixture expects {exp_nav!r} but registry has {reg_nav!r}"
                )

            if isinstance(exp_nav, str) and exp_nav not in nav_hrefs:
                errors.append(
                    f"{label}: nav_operator_href {exp_nav!r} not found in operator nav builders "
                    f"(update archlucid-ui *nav-group-builder.ts or fixture)"
                )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Commercial tier packaging drift guard.")
    _ = parser.parse_args()
    root = repo_root()
    errors = run_check(root)

    if errors:
        print("assert_commercial_tier_packaging_drift failures:", file=sys.stderr)

        for err in errors:
            print(f"  - {err}", file=sys.stderr)

        return 1

    print("assert_commercial_tier_packaging_drift: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
