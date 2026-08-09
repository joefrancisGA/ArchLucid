#!/usr/bin/env python3
"""Mirror the API Container App's SQL configuration onto the worker, then verify worker completeness.

Terraform declares no ``ConnectionStrings`` for any Container App: ``infra/terraform-container-apps/main.tf``
marks env/secrets as operator-managed through ``lifecycle { ignore_changes = ... }`` (TB-657), so SQL
settings are applied out-of-band. The API app received that treatment; the worker never did, so
``ArchLucid.Worker`` crash-looped at startup on ``Missing connection string 'ArchLucid'.`` raised by
``SqlStorageProviderRegistrar``. Post-deploy smoke never probed the worker (it has no ingress), so CD
kept reporting green.

The API app is therefore the single source of truth for these values. CD copies them across rather than
introducing duplicate GitHub secrets that could drift out of sync with the API.

This module computes the plan only; the workflow performs the ``az containerapp`` calls. Values are
written to a file instead of a step output so connection strings never pass through workflow outputs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

# Settings mirrored onto the worker whenever the API exposes them as literal values. Order is stable so
# log lines and the generated args file are deterministic.
MIRRORED_NAMES: tuple[str, ...] = (
    "ArchLucid__StorageProvider",
    "ArchLucid__SqlTopology__Mode",
    "ConnectionStrings__ArchLucid",
    "ConnectionStrings__ArchLucidSystem",
    "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate",
    "ArchLucid__SqlTopology__DevelopmentTenantConnectionString",
    "ArchLucid__SqlTopology__DevelopmentTenantBootstrapConnectionString",
)

# Names the worker cannot start without. Mirrors the API's own pre-deploy completeness check and adds
# ConnectionStrings__ArchLucid, which SqlStorageProviderRegistrar dereferences before anything else.
REQUIRED_NAMES: tuple[str, ...] = (
    "ArchLucid__SqlTopology__Mode",
    "ConnectionStrings__ArchLucid",
    "ConnectionStrings__ArchLucidSystem",
    "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-env-json", default="[]", help="JSON array of API container env entries")
    parser.add_argument("--worker-env-json", default="[]", help="JSON array of worker container env entries")
    parser.add_argument(
        "--set-env-args-out",
        type=Path,
        default=None,
        help="File to receive one NAME=VALUE per line for az containerapp update --set-env-vars",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Assert the worker itself carries every required name; plan no changes",
    )
    return parser.parse_args(argv)


def parse_env_entries(raw: str | None) -> list[dict[str, Any]]:
    """Parse an ``az containerapp show`` env array, tolerating empty, malformed, or non-array input."""
    if raw is None:
        return []

    try:
        parsed = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    return [entry for entry in parsed if isinstance(entry, dict)]


def index_by_name(entries: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Index env entries by name; the last entry wins, as Container Apps resolves duplicates."""
    indexed: dict[str, dict[str, Any]] = {}

    for entry in entries:
        name = entry.get("name")

        if isinstance(name, str) and name != "":
            indexed[name] = entry

    return indexed


def literal_value(indexed: dict[str, dict[str, Any]], name: str) -> str | None:
    """Literal value for ``name``, or None when it is absent, empty, or bound to a secret reference."""
    entry = indexed.get(name)

    if entry is None:
        return None

    value = entry.get("value")

    if not isinstance(value, str) or value == "":
        return None

    return value


def secret_reference(indexed: dict[str, dict[str, Any]], name: str) -> str | None:
    """Secret name backing ``name``, or None when it is not bound to a Container App secret."""
    entry = indexed.get(name)

    if entry is None:
        return None

    reference = entry.get("secretRef")

    if not isinstance(reference, str) or reference == "":
        return None

    return reference


def is_bound(indexed: dict[str, dict[str, Any]], name: str) -> bool:
    """True when the name resolves to either a literal value or a secret reference."""
    return literal_value(indexed, name) is not None or secret_reference(indexed, name) is not None


def is_sensitive(name: str) -> bool:
    """Connection strings are masked in workflow logs; topology mode and provider names are not secret."""
    return "ConnectionString" in name


def plan_pairs(
    api_indexed: dict[str, dict[str, Any]],
    worker_indexed: dict[str, dict[str, Any]],
) -> list[tuple[str, str]]:
    """NAME/VALUE pairs to push onto the worker, skipping values that already match.

    Skipping matches matters beyond efficiency: every ``az containerapp update`` starts a new revision
    and a cold-start window (TB-756), so an unconditional heal would churn a revision on every deploy.
    """
    pairs: list[tuple[str, str]] = []

    for name in MIRRORED_NAMES:
        api_value = literal_value(api_indexed, name)

        if api_value is None:
            continue

        if literal_value(worker_indexed, name) == api_value:
            continue

        pairs.append((name, api_value))

    return pairs


def plan_failures(
    api_indexed: dict[str, dict[str, Any]],
    worker_indexed: dict[str, dict[str, Any]],
) -> list[str]:
    """Errors for required names the worker will still lack after mirroring what the API offers."""
    failures: list[str] = []

    for name in REQUIRED_NAMES:
        if is_bound(worker_indexed, name):
            continue

        if literal_value(api_indexed, name) is not None:
            continue

        if secret_reference(api_indexed, name) is not None:
            failures.append(
                f"{name} is bound to a Container App secret on the API app, so its value cannot be "
                "mirrored across apps. Copy the secret onto the worker app manually."
            )
        else:
            failures.append(
                f"{name} is set on neither the worker nor the API app, so there is nothing to mirror. "
                "Set it on both apps."
            )

    return failures


def verify_failures(worker_indexed: dict[str, dict[str, Any]]) -> list[str]:
    """Errors for required names missing from the worker app itself (post-heal verification)."""
    return [
        f"{name} is not set on the worker app."
        for name in REQUIRED_NAMES
        if not is_bound(worker_indexed, name)
    ]


def format_set_env_args(pairs: list[tuple[str, str]]) -> list[str]:
    """Render pairs as ``az containerapp update --set-env-vars`` arguments."""
    return [f"{name}={value}" for name, value in pairs]


def find_multiline_names(pairs: list[tuple[str, str]]) -> list[str]:
    """Names whose value spans lines; the workflow reads the args file per line, so those would corrupt it."""
    return [name for name, value in pairs if "\n" in value or "\r" in value]


def write_set_env_args(path: Path, pairs: list[tuple[str, str]]) -> None:
    """Write one NAME=VALUE per line, or an empty file when there is nothing to change."""
    lines = format_set_env_args(pairs)
    path.write_text("".join(f"{line}\n" for line in lines), encoding="utf-8")


def emit_masks(pairs: list[tuple[str, str]]) -> None:
    """Register secret values with the Actions log masker before they can reach any later log line."""
    for name, value in pairs:
        if is_sensitive(name):
            print(f"::add-mask::{value}")


def _report_failures(failures: list[str]) -> None:
    for failure in failures:
        print(f"::error::WORKER CONFIG: {failure}")

    print(
        "::error::Worker SQL configuration is incomplete — ArchLucid.Worker cannot start without it. "
        "Fix the Container App env vars before retrying CD."
    )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    api_indexed = index_by_name(parse_env_entries(args.api_env_json))
    worker_indexed = index_by_name(parse_env_entries(args.worker_env_json))

    if args.verify_only:
        failures = verify_failures(worker_indexed)

        if failures:
            _report_failures(failures)
            return 1

        print("Worker SQL configuration completeness check passed.")
        return 0

    failures = plan_failures(api_indexed, worker_indexed)

    if failures:
        _report_failures(failures)
        return 1

    pairs = plan_pairs(api_indexed, worker_indexed)
    multiline = find_multiline_names(pairs)

    if multiline:
        print(
            "::error::WORKER CONFIG: cannot mirror multi-line values: "
            + ", ".join(multiline)
        )
        return 1

    emit_masks(pairs)

    if args.set_env_args_out is not None:
        write_set_env_args(args.set_env_args_out, pairs)

    if pairs:
        print(
            "Mirroring worker SQL configuration from the API app: "
            + ", ".join(name for name, _ in pairs)
        )
    else:
        print("Worker SQL configuration already matches the API app; no update needed.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
