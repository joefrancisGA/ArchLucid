#!/usr/bin/env python3
"""TB-2079: enforce API latency-tier contract (async Tier C/D must opt into 202 + [AsyncRequired]).

Fails when:
  - A manifest route marked requiresAccepted202 / requiresAsyncRequiredAttribute lacks the marker
    or ProducesResponseType(Status202Accepted) on the matching controller action.
  - A Tier C sync route declares an asyncSiblingId that is missing from the manifest or controllers.
  - A controller exposes a Tier C-shaped sync path (…/execute or …/replay without /async) that is
    not on the tierCSyncPathAllowlist (intentional sync regression guard).

Usage:
  python scripts/ci/check_api_latency_tiers.py
  python scripts/ci/check_api_latency_tiers.py --include-regression-fixture  # must exit 1
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


_HTTP_ATTR_RE = re.compile(
    r'\[Http(Get|Post|Put|Patch|Delete)\(\s*"([^"]*)"\s*\)\]',
    re.IGNORECASE,
)
_ROUTE_ATTR_RE = re.compile(r'\[Route\(\s*"([^"]+)"\s*\)\]')
_PRODUCES_202_RE = re.compile(
    r"ProducesResponseType\([^)]*StatusCodes\.Status202Accepted|"
    r"ProducesResponseType\(\s*StatusCodes\.Status202Accepted|"
    r"StatusCodes\.Status202Accepted\s*\)",
    re.MULTILINE,
)
_ASYNC_REQUIRED_RE = re.compile(r"^\s*\[AsyncRequired(?:Attribute)?\]", re.MULTILINE)
# Only the architecture-review execute/replay family from the LRO contract (not every */replay).
_TIER_C_SYNC_PATH_RE = re.compile(
    r"^/v1/architecture/review/\{[^/]+\}/(?:execute(?:/selective)?|replay)$",
    re.IGNORECASE,
)
_CLASS_NAME_RE = re.compile(
    r"\b(?:public\s+)?(?:sealed\s+)?(?:partial\s+)?class\s+(\w+)",
)


@dataclass(frozen=True)
class ControllerAction:
    method: str
    path_template: str
    source: str
    attribute_window: str


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize_path(raw: str) -> str:
    path = raw.replace("v{version:apiVersion}", "v1").replace("//", "/")

    if not path.startswith("/"):
        path = "/" + path

    return path.rstrip("/") or "/"


def load_manifest(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict) or payload.get("version") != 1:
        raise ValueError(f"{path}: expected version 1 object")

    routes = payload.get("routes")

    if not isinstance(routes, list) or not routes:
        raise ValueError(f"{path}: routes must be a non-empty list")

    return payload


def discover_cs_files(controllers_dirs: list[Path]) -> list[Path]:
    files: list[Path] = []

    for controllers_dir in controllers_dirs:
        if not controllers_dir.is_dir():
            continue

        files.extend(sorted(controllers_dir.rglob("*.cs")))

    return files


def build_type_route_map(cs_files: list[Path]) -> dict[str, str]:
    """Map controller type name -> [Route] template, merging partial class files."""
    type_routes: dict[str, str] = {}

    for path in cs_files:
        text = path.read_text(encoding="utf-8")
        route_match = _ROUTE_ATTR_RE.search(text)

        if route_match is None:
            continue

        class_match = _CLASS_NAME_RE.search(text)

        if class_match is None:
            continue

        type_routes[class_match.group(1)] = route_match.group(1)

    return type_routes


def discover_controller_actions(controllers_dirs: list[Path]) -> list[ControllerAction]:
    actions: list[ControllerAction] = []
    cs_files = discover_cs_files(controllers_dirs)
    type_routes = build_type_route_map(cs_files)

    for path in cs_files:
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        class_match = _CLASS_NAME_RE.search(text)
        class_name = class_match.group(1) if class_match else ""
        # Prefer in-file Route, else sibling partial that declared [Route] (e.g. RunsController.AsyncOperations.cs).
        in_file_route = _ROUTE_ATTR_RE.search(text)
        class_route = (
            in_file_route.group(1)
            if in_file_route is not None
            else type_routes.get(class_name, "")
        )

        for line_no, line in enumerate(lines):
            http_match = _HTTP_ATTR_RE.search(line.strip())

            if http_match is None:
                continue

            verb = http_match.group(1).upper()
            action_route = http_match.group(2)
            combined = f"{class_route}/{action_route}".replace("//", "/")
            start = max(0, line_no - 12)
            end = min(len(lines), line_no + 8)
            window = "\n".join(lines[start:end])
            actions.append(
                ControllerAction(
                    method=verb,
                    path_template=normalize_path(combined),
                    source=f"{path.as_posix()}:{line_no + 1}",
                    attribute_window=window,
                )
            )

    return actions


def index_actions(actions: list[ControllerAction]) -> dict[tuple[str, str], ControllerAction]:
    indexed: dict[tuple[str, str], ControllerAction] = {}

    for action in actions:
        key = (action.method, action.path_template)

        # Last write wins; fixtures append after product controllers when included.
        indexed[key] = action

    return indexed


def validate_manifest_schema(manifest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    ids: set[str] = set()

    for row in manifest["routes"]:
        if not isinstance(row, dict):
            errors.append("route entry must be an object")
            continue

        route_id = row.get("id")
        method = row.get("method")
        path = row.get("pathTemplate")
        tier = row.get("tier")

        if not isinstance(route_id, str) or not route_id:
            errors.append("route missing id")
            continue

        if route_id in ids:
            errors.append(f"duplicate route id: {route_id}")

        ids.add(route_id)

        if method not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
            errors.append(f"{route_id}: invalid method {method!r}")

        if not isinstance(path, str) or not path.startswith("/"):
            errors.append(f"{route_id}: pathTemplate must start with /")

        if tier not in {"A", "B", "C", "D"}:
            errors.append(f"{route_id}: tier must be A|B|C|D")

        sibling = row.get("asyncSiblingId")

        if sibling is not None and not isinstance(sibling, str):
            errors.append(f"{route_id}: asyncSiblingId must be a string")

    allowlist = manifest.get("tierCSyncPathAllowlist", [])

    if not isinstance(allowlist, list):
        errors.append("tierCSyncPathAllowlist must be a list")

    return errors


def check_required_202(
    manifest: dict[str, Any],
    by_key: dict[tuple[str, str], ControllerAction],
) -> list[str]:
    errors: list[str] = []
    by_id = {row["id"]: row for row in manifest["routes"] if isinstance(row, dict)}

    for row in manifest["routes"]:
        if not isinstance(row, dict):
            continue

        route_id = row["id"]
        needs_202 = bool(row.get("requiresAccepted202"))
        needs_attr = bool(row.get("requiresAsyncRequiredAttribute"))

        if not needs_202 and not needs_attr:
            continue

        method = str(row["method"]).upper()
        path = normalize_path(str(row["pathTemplate"]))
        action = by_key.get((method, path))

        if action is None:
            errors.append(
                f"{route_id}: controller action not found for {method} {path} "
                "(required for Tier C/D async accept)"
            )
            continue

        if needs_202 and _PRODUCES_202_RE.search(action.attribute_window) is None:
            errors.append(
                f"{route_id}: {method} {path} must declare ProducesResponseType Status202Accepted "
                f"({action.source})"
            )

        if needs_attr and _ASYNC_REQUIRED_RE.search(action.attribute_window) is None:
            errors.append(
                f"{route_id}: {method} {path} must declare [AsyncRequired] "
                f"({action.source})"
            )

        sibling_id = row.get("asyncSiblingId")

        if sibling_id:
            sibling = by_id.get(sibling_id)

            if sibling is None:
                errors.append(f"{route_id}: asyncSiblingId {sibling_id!r} missing from manifest")
            else:
                sib_method = str(sibling["method"]).upper()
                sib_path = normalize_path(str(sibling["pathTemplate"]))

                if (sib_method, sib_path) not in by_key:
                    errors.append(
                        f"{route_id}: async sibling {sib_method} {sib_path} not found in controllers"
                    )

    return errors


def check_sync_siblings(
    manifest: dict[str, Any],
    by_key: dict[tuple[str, str], ControllerAction],
) -> list[str]:
    errors: list[str] = []
    by_id = {row["id"]: row for row in manifest["routes"] if isinstance(row, dict)}

    for row in manifest["routes"]:
        if not isinstance(row, dict):
            continue

        sibling_id = row.get("asyncSiblingId")

        if not sibling_id:
            continue

        route_id = row["id"]
        method = str(row["method"]).upper()
        path = normalize_path(str(row["pathTemplate"]))

        if (method, path) not in by_key:
            errors.append(f"{route_id}: sync route {method} {path} not found in controllers")

        sibling = by_id.get(sibling_id)

        if sibling is None:
            errors.append(f"{route_id}: asyncSiblingId {sibling_id!r} missing from manifest")
            continue

        if not sibling.get("requiresAccepted202"):
            errors.append(
                f"{route_id}: sibling {sibling_id} must set requiresAccepted202: true"
            )

    return errors


def check_tier_c_sync_allowlist(
    manifest: dict[str, Any],
    actions: list[ControllerAction],
) -> list[str]:
    errors: list[str] = []
    allowlist_raw = manifest.get("tierCSyncPathAllowlist") or []
    allowlist = {
        f"{str(item).split(' ', 1)[0].upper()} {normalize_path(str(item).split(' ', 1)[1])}"
        for item in allowlist_raw
        if isinstance(item, str) and " " in item
    }

    for action in actions:
        if action.method != "POST":
            continue

        # Async accepts are Tier C/D with /async — not sync regressions.
        if action.path_template.rstrip("/").endswith("/async"):
            continue

        if _TIER_C_SYNC_PATH_RE.search(action.path_template) is None:
            continue

        key = f"{action.method} {action.path_template}"

        if key not in allowlist:
            errors.append(
                f"Tier C sync path not allowlisted: {key} ({action.source}). "
                "Add an async sibling + [AsyncRequired], or list the path under "
                "tierCSyncPathAllowlist only when Simulator/CI sync is intentional."
            )

    return errors


def run_checks(
    *,
    root: Path,
    manifest_path: Path,
    include_regression_fixture: bool,
) -> list[str]:
    manifest = load_manifest(manifest_path)
    errors = validate_manifest_schema(manifest)

    if errors:
        return errors

    controller_dirs = [root / "ArchLucid.Api" / "Controllers"]

    if include_regression_fixture:
        controller_dirs.append(root / "scripts" / "ci" / "fixtures" / "api_latency_tiers")
        # Inject a Tier C async route that the fixture violates so the gate must fail.
        fixture_route = {
            "id": "bogus-long-async-regression",
            "method": "POST",
            "pathTemplate": "/v1/architecture/review/{runId}/bogus-long/async",
            "tier": "C",
            "requiresAccepted202": True,
            "requiresAsyncRequiredAttribute": True,
        }
        manifest = dict(manifest)
        manifest["routes"] = list(manifest["routes"]) + [fixture_route]

    actions = discover_controller_actions(controller_dirs)
    by_key = index_actions(actions)
    errors.extend(check_required_202(manifest, by_key))
    errors.extend(check_sync_siblings(manifest, by_key))
    errors.extend(check_tier_c_sync_allowlist(manifest, actions))

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=None)
    parser.add_argument(
        "--manifest",
        type=Path,
        default=None,
        help="Override manifest path (default: scripts/ci/data/api_latency_tiers.v1.json)",
    )
    parser.add_argument(
        "--include-regression-fixture",
        action="store_true",
        help="Scan scripts/ci/fixtures/api_latency_tiers (must fail — unit-test only)",
    )
    args = parser.parse_args(argv)

    root = (args.repo_root or repo_root()).resolve()
    manifest_path = (
        args.manifest
        if args.manifest is not None
        else root / "scripts" / "ci" / "data" / "api_latency_tiers.v1.json"
    ).resolve()

    try:
        errors = run_checks(
            root=root,
            manifest_path=manifest_path,
            include_regression_fixture=args.include_regression_fixture,
        )
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"BLOCK: {exc}", file=sys.stderr)
        return 1

    if errors:
        print("API latency-tier check failed (TB-2079):", file=sys.stderr)

        for err in errors:
            print(f"  - {err}", file=sys.stderr)

        return 1

    print("API latency-tier check passed (TB-2079).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
