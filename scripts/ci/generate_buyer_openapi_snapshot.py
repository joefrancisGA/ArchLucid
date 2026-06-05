#!/usr/bin/env python3
"""Filter openapi-v1.contract.snapshot.json to buyer-tier paths (TB-286).

Mirrors ArchLucid.Api.OpenApi.OpenApiAudiencePathClassifier until live OpenAPI is regenerated.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE = REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "openapi-v1.contract.snapshot.json"
TARGET = REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "buyer-contract.openapi.snapshot.json"


def classify(path: str, allows_anonymous: bool) -> str:
    normalized = path.strip("/")

    if normalized.lower().startswith("v1/internal/"):
        return "internal"

    lower = normalized.lower()

    if "tool-invocation-forensics" in lower or "traces/forensics" in lower:
        return "forensics"

    if "buyer-summary" in lower:
        return "buyer"

    if lower.startswith("v1/explain/"):
        return "buyer"

    if lower.startswith("v1/pilots/") and "deltas" in lower:
        return "buyer"

    if lower.startswith("v1/roi/") and "executive" in lower:
        return "buyer"

    if allows_anonymous:
        if (
            lower.startswith("v1/marketing/")
            or lower.startswith("v1/demo/")
            or lower.startswith("v1/registration")
            or lower.startswith("v1/quickstart")
            or lower.startswith("v1/auth/trial")
            or lower == "v1/version"
            or lower.startswith("v1/agent-execution/cost-preview")
        ):
            return "buyer"

    return "operator"


def is_anonymous_path(path: str) -> bool:
    lower = path.lower()
    return (
        lower.startswith("/v1/marketing/")
        or lower.startswith("/v1/demo/")
        or lower.startswith("/v1/registration")
        or lower.startswith("/v1/quickstart")
        or lower.startswith("/v1/auth/trial")
        or lower == "/v1/version"
        or lower.startswith("/v1/agent-execution/cost-preview")
    )


def filter_document(doc: dict) -> dict:
    paths = doc.get("paths", {})
    keep: dict = {}

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue

        audience = classify(path.lstrip("/"), is_anonymous_path(path))

        if audience == "buyer":
            keep[path] = path_item

    result = dict(doc)
    result["paths"] = keep
    return result


def main() -> int:
    if not SOURCE.is_file():
        print(f"Missing source snapshot: {SOURCE}", file=sys.stderr)
        return 1

    doc = json.loads(SOURCE.read_text(encoding="utf-8"))
    filtered = filter_document(doc)

    for path in filtered.get("paths", {}):
        if "/v1/internal/" in path.lower():
            print(f"Buyer snapshot must not include internal path: {path}", file=sys.stderr)
            return 1

    TARGET.write_text(json.dumps(filtered, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {TARGET} ({len(filtered.get('paths', {}))} buyer paths)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
