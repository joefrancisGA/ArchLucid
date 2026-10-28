#!/usr/bin/env python3
"""Capture last-known-good Container Apps release identity before a CD deploy."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from cd_rollback import (  # noqa: E402
    SCHEMA_LKG,
    build_component_record,
    build_lkg_payload,
    extract_build_id_from_env_entries,
    write_json,
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--api-app", default="")
    parser.add_argument("--api-revision", default="")
    parser.add_argument("--api-image", default="")
    parser.add_argument("--api-env-json", default="[]", help="JSON array of container env entries")
    parser.add_argument("--worker-app", default="")
    parser.add_argument("--worker-revision", default="")
    parser.add_argument("--worker-image", default="")
    parser.add_argument("--worker-env-json", default="[]")
    parser.add_argument("--ui-app", default="")
    parser.add_argument("--ui-revision", default="")
    parser.add_argument("--ui-image", default="")
    parser.add_argument("--ui-env-json", default="[]")
    return parser.parse_args(argv)


def _parse_env_json(raw: str, *, component: str) -> list[Any]:
    """Reject malformed capture inputs instead of inventing missing evidence."""
    try:
        value = json.loads(raw)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ValueError(f"{component} environment capture is not valid JSON") from exc
    if not isinstance(value, list):
        raise ValueError(f"{component} environment capture must be an array")
    if not all(isinstance(entry, dict) for entry in value):
        raise ValueError(f"{component} environment entries must be objects")
    return value


_BUILD_ID_KEYS = frozenset({
    "ARCHLUCID_BUILD_COMMIT_SHA", "BUILD_SHA", "NEXT_PUBLIC_BUILD_COMMIT_SHA",
})


def _check_build_identity_consistency(entries: list[dict[str, Any]], component: str) -> None:
    values = {
        entry.get("value").strip()
        for entry in entries
        if entry.get("name") in _BUILD_ID_KEYS
        and isinstance(entry.get("value"), str)
        and entry.get("value").strip()
    }
    if len(values) > 1:
        raise ValueError(f"{component} environment contains conflicting build identities")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        api_env = _parse_env_json(args.api_env_json, component="api")
        worker_env = _parse_env_json(args.worker_env_json, component="worker")
        ui_env = _parse_env_json(args.ui_env_json, component="ui")
        for name, entries in (("api", api_env), ("worker", worker_env), ("ui", ui_env)):
            _check_build_identity_consistency(entries, name)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    api = build_component_record(
        role="api",
        app_name=args.api_app or None,
        revision=args.api_revision or None,
        image=args.api_image or None,
        build_id=extract_build_id_from_env_entries(api_env),
    )
    worker = None
    ui = None

    if args.worker_app.strip() and args.worker_revision.strip():
        worker = build_component_record(
            role="worker",
            app_name=args.worker_app,
            revision=args.worker_revision,
            image=args.worker_image or None,
            build_id=extract_build_id_from_env_entries(worker_env),
        )

    if args.ui_app.strip() and args.ui_revision.strip():
        ui = build_component_record(
            role="ui",
            app_name=args.ui_app,
            revision=args.ui_revision,
            image=args.ui_image or None,
            build_id=extract_build_id_from_env_entries(ui_env),
        )

    payload = build_lkg_payload(
        environment=args.environment,
        api=api,
        worker=worker,
        ui=ui,
    )

    if payload.get("schema") != SCHEMA_LKG:
        raise SystemExit("internal schema mismatch")

    write_json(args.json_out, payload)
    print(
        "Captured last-known-good: "
        f"apiBuildId={api.get('buildId') or '(unknown)'} "
        f"apiRevision={api.get('revision') or '(none)'} "
        f"apiDigest={api.get('digest') or '(none)'}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
