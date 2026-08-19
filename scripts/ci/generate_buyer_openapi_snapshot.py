#!/usr/bin/env python3
"""Filter openapi-v1.contract.snapshot.json to buyer-tier operations (TB-286).

Mirrors ArchLucid.Api.Tests.Contracts.OpenApiBuyerContractFilter and
ArchLucid.Api.Tests.OpenApiJsonCanonicalizer for offline snapshot refresh.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE = REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "openapi-v1.contract.snapshot.json"
TARGET = REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "buyer-contract.openapi.snapshot.json"

HTTP_METHODS = frozenset({"get", "put", "post", "delete", "patch", "head", "options", "trace"})
AUDIENCE_EXTENSION = "x-archlucid-audience"
BUYER_AUDIENCE = "buyer"


def is_anonymous_buyer_path(open_api_path: str) -> bool:
    lower = open_api_path.lower()
    return (
        lower.startswith("/v1/marketing/")
        or lower.startswith("/v1/demo/")
        or lower.startswith("/v1/registration")
        or lower.startswith("/v1/quickstart")
        or lower.startswith("/v1/auth/trial")
        or lower == "/v1/version"
        or lower.startswith("/v1/agent-execution/cost-preview")
    )


def classify_path(open_api_path: str) -> str:
    path = open_api_path.strip("/")
    allows_anonymous = is_anonymous_buyer_path(open_api_path)

    if path.lower().startswith("v1/internal/"):
        return "internal"

    lower = path.lower()

    if "tool-invocation-forensics" in lower or "traces/forensics" in lower:
        return "forensics"

    if "buyer-summary" in lower:
        return BUYER_AUDIENCE

    if lower.startswith("v1/explain/"):
        return BUYER_AUDIENCE

    if lower.startswith("v1/pilots/") and "deltas" in lower:
        return BUYER_AUDIENCE

    if lower.startswith("v1/roi/") and "sponsor" in lower:
        return BUYER_AUDIENCE

    if allows_anonymous:
        return BUYER_AUDIENCE

    return "operator"


def _sort_tags_array(items: list[Any]) -> None:
    if not items:
        return

    if all(isinstance(item, str) for item in items):
        items.sort()
        return

    if all(
        isinstance(item, dict)
        and isinstance(item.get("name"), str)
        and "in" not in item
        for item in items
    ):
        items.sort(key=lambda item: item["name"])


def canonicalize(node: Any, parent_property_name: str | None = None) -> Any:
    if isinstance(node, dict):
        return {
            key: canonicalize(value, key)
            for key, value in sorted(node.items(), key=lambda pair: pair[0])
        }

    if isinstance(node, list):
        items = [canonicalize(item, None) for item in node]

        if items:
            if parent_property_name == "tags":
                _sort_tags_array(items)
            elif parent_property_name == "required" and all(isinstance(item, str) for item in items):
                items.sort()

        return items

    return node


def filter_to_buyer_contract(canonical_open_api: dict[str, Any]) -> dict[str, Any]:
    paths = canonical_open_api.get("paths", {})
    if not isinstance(paths, dict):
        return dict(canonical_open_api)

    keep: dict[str, Any] = {}

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue

        keep_path = False

        for key, operation in path_item.items():
            if key not in HTTP_METHODS or not isinstance(operation, dict):
                continue

            audience = operation.get(AUDIENCE_EXTENSION)

            if audience == BUYER_AUDIENCE:
                keep_path = True
                continue

            if AUDIENCE_EXTENSION not in operation and classify_path(path) == BUYER_AUDIENCE:
                keep_path = True

        if keep_path:
            keep[path] = path_item

    result = dict(canonical_open_api)
    result["paths"] = keep
    return result


def main() -> int:
    if not SOURCE.is_file():
        print(f"Missing source snapshot: {SOURCE}", file=sys.stderr)
        return 1

    doc = json.loads(SOURCE.read_text(encoding="utf-8"))
    canonical = canonicalize(doc)
    filtered = filter_to_buyer_contract(canonical)

    for path in filtered.get("paths", {}):
        if "/v1/internal/" in path.lower():
            print(f"Buyer snapshot must not include internal path: {path}", file=sys.stderr)
            return 1

    TARGET.write_text(
        json.dumps(filtered, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {TARGET} ({len(filtered.get('paths', {}))} buyer paths)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
