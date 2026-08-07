#!/usr/bin/env python3
"""Rewrite first-party callers off dropped ADR 0064 compatibility aliases."""
from __future__ import annotations

from pathlib import Path

ROOT = Path.cwd()

REPLACEMENTS = [
    ("/v1/graph/runs/", "/v1/evidence-graph/reviews/"),
    ("/v1/graph/reviews/", "/v1/evidence-graph/reviews/"),
    ("/v1/graph/snapshot", "/v1/evidence-graph/snapshot"),
    ("/v1/governance/pre-commit/", "/v1/governance/pre-finalize/"),
    ("/v1/artifacts/signed-records/", "/v1/artifacts/signed-review-records/"),
    ("/v1/authority/signed-records/", "/v1/authority/signed-review-records/"),
    ("/v1/artifacts/manifests/", "/v1/artifacts/signed-review-records/"),
    ("/v1/authority/manifests/", "/v1/authority/signed-review-records/"),
    ("/api/proxy/v1/artifacts/signed-records/", "/api/proxy/v1/artifacts/signed-review-records/"),
    ("/api/proxy/v1/authority/signed-records/", "/api/proxy/v1/authority/signed-review-records/"),
    ("/v1/admin/metering/tenants/{tenantId}/summary", "/v1/admin/metering/summary"),
    ("/v1/admin/metering/tenants/{tenantId:D}/summary", "/v1/admin/metering/summary"),
]

# Scoped IDOR test builds path with Guid format — handle separately in file edits if needed.
EXTS = {".cs", ".ts", ".tsx", ".json", ".md"}
EXCLUDE = {"node_modules", ".git", "bin", "obj", ".next", "archive", "dist", ".cache"}


def main() -> int:
    changed = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTS:
            continue
        if any(part in EXCLUDE for part in path.parts):
            continue
        # Skip huge generated snapshots; rewrite lightly later
        if path.name.endswith("openapi-v1.contract.snapshot.json"):
            continue
        if path.name.endswith("ArchLucidApiClient.g.cs"):
            continue
        if path.name.endswith("api-types.generated.ts"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new = text
        for old, repl in REPLACEMENTS:
            new = new.replace(old, repl)
        if new != text:
            path.write_text(new, encoding="utf-8", newline="")
            changed += 1
            print(path.relative_to(ROOT))
    print(f"updated {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
