#!/usr/bin/env python3
"""Create a non-mutating, tenant-scoped private-beta offboarding plan."""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

STEPS = (
    ("disable-access", "Disable tenant users or SCIM access and revoke outstanding invites."),
    ("stop-spend", "Set the tenant budget to zero or block execution for the tenant."),
    ("export", "Export the requested sponsor and audit package while access remains authorized."),
    ("delete", "Apply the documented tombstone or hard-purge policy and retain sealed-evidence exceptions."),
)


def build_plan(tenant_id: str, operator: str) -> dict[str, object]:
    normalized_tenant_id = str(uuid.UUID(tenant_id))

    return {
        "planType": "private-beta-tenant-offboarding-dry-run",
        "dryRun": True,
        "tenantId": normalized_tenant_id,
        "operator": operator,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "steps": [
            {"stepId": step_id, "description": description, "mutatesData": False}
            for step_id, description in STEPS
        ],
        "nextAction": "An authorized operator must execute and record each step; this command performs no API, IdP, storage, or database mutation.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tenant-id", required=True)
    parser.add_argument("--operator", required=True)
    parser.add_argument("--json-out", type=Path, default=None)
    args = parser.parse_args()

    try:
        plan = build_plan(args.tenant_id, args.operator)
    except ValueError as error:
        print(f"ERROR: invalid tenant id: {error}", file=sys.stderr)
        return 1

    rendered = json.dumps(plan, indent=2) + "\n"

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(rendered, encoding="utf-8")

    print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
