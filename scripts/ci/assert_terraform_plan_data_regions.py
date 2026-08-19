#!/usr/bin/env python3
"""CI guard: ensure Terraform plan provisions resources only in expected Azure data regions.

Interprets assessment **DataRegion** as the primary Terraform root input variable `location`,
plus optional DR variable `secondary_location`, and any regions discovered from planned
`data.azurerm_resource_group` values (existing resource group). Always allows **global**
(Traffic Manager, etc.).

Input: one argument, path to a JSON file from `terraform show -json <planfile>`.

Optional: `TERRAFORM_DATA_REGION_ALLOWLIST_EXTRA` — comma-separated regions merged into the allowlist.
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Any


def _normalize_region(value: str) -> str:
    """Normalize for comparison (Azure accepts `eastus` and UI-style `East US`)."""
    return re.sub(r"\s+", "", value.strip().lower())


def _variable_string(plan: Mapping[str, Any], name: str) -> str | None:
    vars_block = plan.get("variables")
    if not isinstance(vars_block, dict):
        return None
    entry = vars_block.get(name)
    if not isinstance(entry, dict):
        return None
    val = entry.get("value")
    if not isinstance(val, str):
        return None
    stripped = val.strip()
    return stripped if stripped else None


def _iter_planned_module_resources(root: Mapping[str, Any]) -> Iterable[Mapping[str, Any]]:
    resources = root.get("resources")
    if isinstance(resources, list):
        for item in resources:
            if isinstance(item, dict):
                yield item

    for child in root.get("child_modules") or []:
        if isinstance(child, dict):
            yield from _iter_planned_module_resources(child)


def _data_resource_group_locations(planned_values: Mapping[str, Any]) -> set[str]:
    out: set[str] = set()
    root_mod = planned_values.get("root_module")
    if not isinstance(root_mod, dict):
        return out

    for res in _iter_planned_module_resources(root_mod):
        if res.get("mode") != "data":
            continue
        if res.get("type") != "azurerm_resource_group":
            continue
        values = res.get("values")
        if not isinstance(values, dict):
            continue
        loc = values.get("location")
        if isinstance(loc, str) and loc.strip():
            out.add(_normalize_region(loc))
    return out


def _extra_allowlist_from_env() -> set[str]:
    raw = os.environ.get("TERRAFORM_DATA_REGION_ALLOWLIST_EXTRA", "")
    out: set[str] = set()
    for part in raw.split(","):
        p = part.strip()
        if p:
            out.add(_normalize_region(p))
    return out


def build_expected_region_allowlist(plan: Mapping[str, Any]) -> set[str]:
    """Regions that managed resources may use for `location` (normalized lowercase)."""
    allowed: set[str] = set()

    primary = _variable_string(plan, "location")
    if primary is not None:
        allowed.add(_normalize_region(primary))

    secondary = _variable_string(plan, "secondary_location")
    if secondary is not None:
        allowed.add(_normalize_region(secondary))

    planned = plan.get("planned_values")
    if isinstance(planned, dict):
        allowed |= _data_resource_group_locations(planned)

    allowed |= _extra_allowlist_from_env()

    # Azure-wide sentinel used by several resource types.
    allowed.add("global")
    return allowed


def _should_check_resource_change(rc: Mapping[str, Any]) -> bool:
    if rc.get("mode") != "managed":
        return False
    change = rc.get("change")
    if not isinstance(change, dict):
        return False
    actions = change.get("actions")
    if not isinstance(actions, list) or not actions:
        return False
    action_set = {str(a) for a in actions}
    if action_set <= {"delete"}:
        return False
    if action_set == {"no-op"}:
        return False
    return True


def find_location_violations(plan: Mapping[str, Any], allowed: set[str]) -> list[tuple[str, str]]:
    violations: list[tuple[str, str]] = []
    for rc in plan.get("resource_changes") or []:
        if not isinstance(rc, dict):
            continue
        if not _should_check_resource_change(rc):
            continue
        change = rc.get("change")
        if not isinstance(change, dict):
            continue
        after = change.get("after")
        if not isinstance(after, dict):
            continue
        if "location" not in after:
            continue
        loc = after.get("location")
        if loc is None or not isinstance(loc, str) or not loc.strip():
            continue
        norm = _normalize_region(loc)
        if norm not in allowed:
            addr = str(rc.get("address") or rc.get("name") or "<unknown>")
            violations.append((addr, loc))
    return violations


def validate_plan_data_regions(plan: Mapping[str, Any]) -> tuple[list[tuple[str, str]], str | None]:
    """
    Returns (violations, configuration_error).

    configuration_error is set when no regional allowlist can be derived (exit code 2).
    Non-empty violations mean at least one managed resource uses a disallowed location (exit code 1).
    """
    allowed = build_expected_region_allowlist(plan)
    regional_allowed = {r for r in allowed if r != "global"}

    if not regional_allowed:
        return [], (
            "Could not derive any regional allowlist (set root variable `location`, and/or plan "
            "`data.azurerm_resource_group`, or export TERRAFORM_DATA_REGION_ALLOWLIST_EXTRA)."
        )

    return find_location_violations(plan, allowed), None


def main() -> int:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <terraform-show-json-plan-file>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"Not a file: {path}", file=sys.stderr)
        return 2

    try:
        plan = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON: {path}: {exc}", file=sys.stderr)
        return 2

    if not isinstance(plan, dict):
        print("Plan JSON root must be an object.", file=sys.stderr)
        return 2

    violations, configuration_error = validate_plan_data_regions(plan)
    if configuration_error is not None:
        print(f"assert_terraform_plan_data_regions: {configuration_error}", file=sys.stderr)
        return 2

    if violations:
        allowed = build_expected_region_allowlist(plan)
        regional_allowed = {r for r in allowed if r != "global"}
        print("Terraform plan provisions resources outside expected data regions:", file=sys.stderr)
        for addr, loc in violations:
            allowed_display = ", ".join(sorted(regional_allowed))
            print(
                f"  {addr}: location={loc!r} (allowed regional: {allowed_display}; global always allowed)",
                file=sys.stderr,
            )
        return 1

    print("OK: all planned resource locations are within expected data regions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
