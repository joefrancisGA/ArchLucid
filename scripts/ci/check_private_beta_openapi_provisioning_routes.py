#!/usr/bin/env python3
"""Verify invite and SCIM provisioning routes remain in the OpenAPI snapshot."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_ROUTES: dict[str, tuple[str, ...]] = {
    "/v1/admin/users/invite": ("post",),
    "/v1/admin/users/invitations": ("get",),
    "/v1/admin/users/invitations/{invitationId}": ("delete",),
    "/v1/auth/invitations/validate": ("get",),
    "/scim/v2/Users": ("get", "post"),
    "/scim/v2/Users/{id}": ("delete", "get", "patch", "put"),
}


def _load_snapshot(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict) or not isinstance(payload.get("paths"), dict):
        raise ValueError("OpenAPI snapshot must contain a paths object")

    return payload


def collect_violations(payload: dict[str, Any]) -> list[str]:
    paths = payload.get("paths")

    if not isinstance(paths, dict):
        return ["OpenAPI snapshot paths must be an object"]

    violations: list[str] = []

    for route, methods in REQUIRED_ROUTES.items():
        route_payload = paths.get(route)

        if not isinstance(route_payload, dict):
            violations.append(f"missing provisioning route: {route}")
            continue

        missing_methods = [method for method in methods if method not in route_payload]

        if missing_methods:
            violations.append(f"{route} is missing methods: {', '.join(missing_methods)}")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--snapshot",
        type=Path,
        default=REPO_ROOT / "ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json",
    )
    args = parser.parse_args()

    try:
        violations = collect_violations(_load_snapshot(args.snapshot.resolve()))
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    if violations:
        for violation in violations:
            print(f"ERROR: {violation}")

        return 1

    print("Private-beta provisioning OpenAPI routes: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
