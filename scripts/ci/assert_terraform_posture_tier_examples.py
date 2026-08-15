#!/usr/bin/env python3
"""CI guard (TB-903): posture_tier plumbing and production tfvars examples stay aligned."""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

# Terraform roots that ship posture_checks.tf for TB-903.
POSTURE_TIER_ROOTS: tuple[str, ...] = (
    "infra/terraform-container-apps",
    "infra/terraform-storage",
    "infra/terraform-sql-failover",
    "infra/terraform-private",
    "infra/terraform-redis",
    "infra/terraform-openai",
    "infra/terraform-monitoring",
    "infra/terraform-keyvault",
    "infra/terraform-edge",
    "infra/terraform-cosmos",
)

_POSTURE_TIER_RE = re.compile(
    r'posture_tier\s*=\s*"(?P<tier>dev|staging|production)"',
    re.MULTILINE,
)


def _failures(repo_root: Path) -> list[str]:
    errors: list[str] = []

    for rel in POSTURE_TIER_ROOTS:
        root = repo_root / rel
        checks = root / "posture_checks.tf"
        legacy_checks = root / "checks.tf"
        if checks.is_file():
            checks_path = checks
        elif legacy_checks.is_file() and "posture_is_production" in legacy_checks.read_text(encoding="utf-8"):
            checks_path = legacy_checks
        else:
            errors.append(f"{rel}: missing posture_checks.tf (or checks.tf with posture_* checks)")
            continue

        posture_vars = root / "posture_variables.tf"
        variables_tf = root / "variables.tf"
        if not posture_vars.is_file() and not (
            variables_tf.is_file() and 'variable "posture_tier"' in variables_tf.read_text(encoding="utf-8")
        ):
            errors.append(f"{rel}: missing posture_tier variable (posture_variables.tf or variables.tf)")

        production_example = root / "production.tfvars.example"
        if not production_example.is_file():
            errors.append(f"{rel}: missing production.tfvars.example")
            continue

        production_text = production_example.read_text(encoding="utf-8")
        match = _POSTURE_TIER_RE.search(production_text)
        if match is None:
            errors.append(f"{rel}/production.tfvars.example: must set posture_tier = \"production\"")
        elif match.group("tier") != "production":
            errors.append(
                f"{rel}/production.tfvars.example: posture_tier must be production (found {match.group('tier')!r})"
            )

    private_closure = repo_root / "infra/terraform-private/public_access_closure.tf"
    if not private_closure.is_file():
        errors.append("infra/terraform-private: missing public_access_closure.tf (TB-903 PE closure)")
    elif "azapi_update_resource" not in private_closure.read_text(encoding="utf-8"):
        errors.append("infra/terraform-private/public_access_closure.tf: expected azapi_update_resource resources")

    frontdoor = repo_root / "infra/terraform-edge/frontdoor.tf"
    if frontdoor.is_file():
        frontdoor_text = frontdoor.read_text(encoding="utf-8")
        if "Microsoft_DefaultRuleSet" in frontdoor_text or "Microsoft_BotManagerRuleSet" in frontdoor_text:
            errors.append("infra/terraform-edge/frontdoor.tf: remove Premium-only managed rule sets (TB-903)")

    sql_staging = repo_root / "infra/terraform-sql-failover/staging.tfvars.example"
    if sql_staging.is_file():
        staging_text = sql_staging.read_text(encoding="utf-8")
        if "staging-sql-failover-drill-window" not in staging_text:
            errors.append(
                "infra/terraform-sql-failover/staging.tfvars.example: "
                "document staging-sql-failover-drill-window waiver (TB-905)"
            )

    return errors


def main() -> int:
    repo_root = REPO_ROOT
    errors = _failures(repo_root)
    if errors:
        print("FAIL assert_terraform_posture_tier_examples:", file=sys.stderr)
        for line in errors:
            print(f"  - {line}", file=sys.stderr)
        return 1

    print("OK assert_terraform_posture_tier_examples")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
