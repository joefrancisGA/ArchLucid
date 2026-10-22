#!/usr/bin/env python3
"""CI guard: hosted Azure extractor onboarding IaC assigns only Reader + Cost Management Reader."""
from __future__ import annotations

import re
import sys
from pathlib import Path

FORBIDDEN_ROLE_NAMES = (
    "Owner",
    "Contributor",
    "User Access Administrator",
    "Global Reader",
)

ALLOWED_ROLE_NAMES = (
    "Reader",
    "Cost Management Reader",
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent.parent


def _assert_terraform_roles(main_tf: Path) -> None:
    text = main_tf.read_text(encoding="utf-8")

    for forbidden in FORBIDDEN_ROLE_NAMES:
        if re.search(rf'role_definition_name\s*=\s*"{re.escape(forbidden)}"', text):
            raise AssertionError(f"Forbidden role in Terraform: {forbidden}")

    found_allowed = {
        role
        for role in ALLOWED_ROLE_NAMES
        if re.search(rf'role_definition_name\s*=\s*"{re.escape(role)}"', text)
    }

    if found_allowed != set(ALLOWED_ROLE_NAMES):
        missing = set(ALLOWED_ROLE_NAMES) - found_allowed
        raise AssertionError(f"Terraform missing required role assignments: {sorted(missing)}")


def _assert_bicep_roles(main_bicep: Path) -> None:
    text = main_bicep.read_text(encoding="utf-8")

    for forbidden in FORBIDDEN_ROLE_NAMES:
        if forbidden in text and f"'{forbidden}'" in text and "forbiddenRoles" not in text:
            raise AssertionError(f"Forbidden role assignment detected in Bicep: {forbidden}")

    if "Cost Management Reader" not in text or "Reader" not in text:
        raise AssertionError("Bicep must declare Reader and Cost Management Reader assignments.")


def main() -> int:
    root = _repo_root()
    terraform_main = root / "infra" / "terraform-customer-onboarding" / "main.tf"
    bicep_main = root / "infra" / "bicep-customer-onboarding" / "main.bicep"

    if not terraform_main.is_file() or not bicep_main.is_file():
        print("Missing hosted extractor onboarding IaC files.", file=sys.stderr)
        return 2

    _assert_terraform_roles(terraform_main)
    _assert_bicep_roles(bicep_main)
    print("OK: hosted Azure extractor onboarding role guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
