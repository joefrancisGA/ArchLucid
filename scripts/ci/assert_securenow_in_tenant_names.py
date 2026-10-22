#!/usr/bin/env python3
"""Fail when the in-tenant SecureNow example would name a resource with the hosted product token.

ADR 0104: a UHG install must not put that token in resource names. terraform plan needs Azure
credentials, so this guard reads terraform.tfvars.example and the root's name arguments instead.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT_RELATIVE = Path("infra/terraform-securenow-in-tenant")
FORBIDDEN = "archlucid"

_NAME_ATTRS = (
    "name",
    "display_name",
    "account_name",
    "sql_server_name",
    "sql_database_name",
    "virtual_network_name",
    "sql_private_endpoint_name",
    "blob_private_endpoint_name",
    "key_vault_private_endpoint_name",
    "openai_private_endpoint_name",
    "private_endpoints_subnet_name",
    "storage_account_name",
    "openai_account_name",
)

_QUOTED = re.compile(
    r"(?m)^(?P<indent>\s*)(?P<attr>" + "|".join(_NAME_ATTRS) + r")\s*=\s*\"(?P<value>[^\"]*)\""
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _strip_comments(text: str) -> str:
    lines: list[str] = []

    for line in text.splitlines():

        if line.strip().startswith("#"):
            continue

        if "strcontains(" in line:
            continue

        lines.append(line)

    return "\n".join(lines)


def _tfvars_value(text: str, name: str) -> str | None:
    match = re.search(rf"(?m)^\s*{re.escape(name)}\s*=\s*\"([^\"]*)\"", text)

    if match is None:
        return None

    return match.group(1)


def name_violations(root_dir: Path) -> list[str]:
    """Return human-readable failures. Empty means the UHG example names are clean."""

    if not root_dir.is_dir():
        return [f"missing Terraform root {root_dir}"]

    example = root_dir / "terraform.tfvars.example"

    if not example.is_file():
        return [f"missing {example}"]

    example_text = example.read_text(encoding="utf-8")
    edition = _tfvars_value(example_text, "edition")
    name_prefix = _tfvars_value(example_text, "name_prefix")
    failures: list[str] = []

    if edition is None or edition.lower() != "uhg":
        failures.append("terraform.tfvars.example must set edition to uhg")

    if name_prefix is None or FORBIDDEN in name_prefix.lower():
        failures.append("terraform.tfvars.example name_prefix contains the hosted product token or is missing")

    prefix = name_prefix or ""
    combined = []

    for path in sorted(root_dir.glob("*.tf")):
        body = _strip_comments(path.read_text(encoding="utf-8"))
        combined.append(body)

        for match in _QUOTED.finditer(body):
            value = match.group("value")

            # Container env names are application configuration keys, not Azure resource names.
            if any(character.isupper() for character in value):
                continue

            expanded = value.replace("${var.name_prefix}", prefix).replace("local.", "")

            if FORBIDDEN in expanded.lower():
                failures.append(f"{path.name}: {match.group('attr')} expands to a name containing the hosted product token")

    root_text = "\n".join(combined)
    collapsed = re.sub(r"[ \t]+", " ", root_text)
    required_snippets = (
        "enable_private_data_plane = true",
        "public_network_access_enabled = false",
        "shared_access_key_enabled = false",
        "block_public_sql_access = true",
        "enable_private_endpoint = false",
        "external_enabled = false",
        "internal_load_balancer_enabled = true",
        'value = "InTenant"',
        'value = "security"',
        "sql_private_endpoint_name",
        "blob_private_endpoint_name",
        "key_vault_private_endpoint_name",
        "openai_private_endpoint_name",
    )

    for snippet in required_snippets:

        if snippet not in collapsed:
            failures.append(f"in-tenant root is missing required snippet: {snippet}")

    if "external_enabled = true" in collapsed:
        failures.append("in-tenant root sets public ingress")

    if "ignore_changes" in root_text:
        failures.append("in-tenant root must not ignore image changes")

    if re.search(r"(?i)account_key|sas_token|shared_access_key\s*=\s*true", root_text):
        failures.append("in-tenant root must not configure a storage key or SAS token")

    return failures


def main() -> int:
    root = _repo_root() / ROOT_RELATIVE
    failures = name_violations(root)

    if failures:
        print("FAIL assert_securenow_in_tenant_names:", file=sys.stderr)

        for failure in failures:
            print(f"- {failure}", file=sys.stderr)

        return 1

    print("OK assert_securenow_in_tenant_names")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
