#!/usr/bin/env python3
"""Generate buyer-safe tenant isolation verification pack (Improvement #14)."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "dist" / "tenant-isolation-verification-pack"

REFERENCE_DOCS = (
    "docs/go-to-market/TENANT_ISOLATION.md",
    "docs/library/TENANT_DATABASE_TOPOLOGY.md",
    "docs/security/MULTI_TENANT_RLS.md",
    "docs/library/AUDIT_COVERAGE_MATRIX.md",
    "docs/library/AZURE_AI_SEARCH_INDEX_CONTRACT.md",
    "docs/security/AUTHORIZATION_BOUNDARY_TEST_INVENTORY.md",
)


def _git_head() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"


def _read_topology_mode() -> str:
    scope_index = REPO_ROOT / "docs/library/V1_DEFERRED_SCOPE_INDEX.json"

    if not scope_index.is_file():
        return "SystemWithPerTenantCatalogs"

    text = scope_index.read_text(encoding="utf-8")

    if "SystemWithPerTenantCatalogs" in text:
        return "SystemWithPerTenantCatalogs"

    return "unknown"


def build_pack_payload() -> dict[str, object]:
    generated_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    missing_docs = [rel for rel in REFERENCE_DOCS if not (REPO_ROOT / rel).is_file()]

    return {
        "schemaVersion": 1,
        "generatedUtc": generated_utc,
        "gitCommit": _git_head(),
        "purpose": "Buyer-safe tenant isolation verification summary — metadata only; no tenant data or secrets.",
        "topology": {
            "mode": _read_topology_mode(),
            "bindingTable": "TenantDatabaseBindings",
            "hostedPosture": "database-per-tenant product catalog via SystemWithPerTenantCatalogs",
            "rlsDefault": "optional; STATE=OFF by default in production posture",
        },
        "isolationLayers": {
            "identity": {
                "primary": "Entra JWT app roles (JwtBearer) or scoped API keys",
                "apiKeyHeader": "X-Api-Key",
                "reference": "docs/REPOSITORY_README.md#api-authentication-archlucidauth",
            },
            "application": {
                "policies": ["ReadAuthority", "ExecuteAuthority", "AdminAuthority"],
                "scopeHeaders": ["X-Tenant-Id", "X-Workspace-Id", "X-Project-Id"],
                "scopeProvider": "HttpScopeContextProvider",
                "reference": "docs/security/MULTI_TENANT_RLS.md",
            },
            "database": {
                "resolver": "ITenantDatabaseResolver / ScopedRoutingSqlConnectionFactory",
                "controlPlaneGuard": "TenantIsolationException when tenant scope resolves control-plane catalog",
                "reference": "docs/library/TENANT_DATABASE_TOPOLOGY.md",
            },
            "retrieval": {
                "policyPackSafeDefault": "AllowedPolicyPackRulePackIds null or empty excludes PolicyPack corpus",
                "azureSearchFilter": "AzureSearchTenantScopeFilterBuilder OData tenant/workspace/project filter",
                "inMemoryIndexGuard": "InMemoryVectorIndex.MatchesAssignedPolicyPack",
                "reference": "docs/library/AZURE_AI_SEARCH_INDEX_CONTRACT.md",
            },
        },
        "auditEvidence": {
            "matrixPath": "docs/library/AUDIT_COVERAGE_MATRIX.md",
            "appendOnlyDesign": True,
            "sampleEventMetadataOnly": True,
        },
        "automatedTests": {
            "tenantIsolationSmoke": "ArchLucid.Api.Tests/Security/TenantIsolationSmokeTests.cs",
            "retrievalTenantIsolation": "ArchLucid.Retrieval.Tests/Evaluation/RetrievalIrEvalTests.cs",
            "sqlRoutingGuard": "ArchLucid.Persistence.Tests/Connections/ScopedRoutingSqlConnectionFactoryUnitTests.cs",
            "azureSearchFilterTests": "ArchLucid.Retrieval.Tests/AzureSearchTenantScopeFilterBuilderTests.cs",
        },
        "redactionNotes": [
            "No connection strings, API keys, or raw customer content.",
            "No cross-tenant identifiers beyond redacted metadata labels.",
            "Support bundles must be reviewed before external upload.",
        ],
        "referenceDocs": list(REFERENCE_DOCS),
        "missingReferenceDocs": missing_docs,
    }


def _render_markdown(payload: dict[str, object]) -> str:
    topology = payload["topology"]
    assert isinstance(topology, dict)
    layers = payload["isolationLayers"]
    assert isinstance(layers, dict)
    redaction = payload["redactionNotes"]
    assert isinstance(redaction, list)
    refs = payload["referenceDocs"]
    assert isinstance(refs, list)

    lines = [
        "> **Scope:** Buyer-safe tenant isolation verification summary — metadata and pointers only; no tenant data.",
        "",
        "# Tenant isolation verification pack",
        "",
        f"**Generated (UTC):** {payload['generatedUtc']}",
        f"**Git commit:** `{payload['gitCommit']}`",
        "",
        "## Topology",
        "",
        f"- **Mode:** `{topology.get('mode')}`",
        f"- **Binding table:** `{topology.get('bindingTable')}`",
        f"- **Hosted posture:** {topology.get('hostedPosture')}",
        f"- **RLS default:** {topology.get('rlsDefault')}",
        "",
        "## Isolation layers",
        "",
        "### Identity",
        "",
        f"- Primary: {layers['identity']['primary']}",
        f"- API key header: `{layers['identity']['apiKeyHeader']}`",
        "",
        "### Application",
        "",
        f"- Policies: {', '.join(layers['application']['policies'])}",
        f"- Scope headers: {', '.join(layers['application']['scopeHeaders'])}",
        "",
        "### Database",
        "",
        f"- Resolver: `{layers['database']['resolver']}`",
        f"- Control-plane guard: {layers['database']['controlPlaneGuard']}",
        "",
        "### Retrieval",
        "",
        f"- Policy-pack safe default: {layers['retrieval']['policyPackSafeDefault']}",
        f"- Azure Search filter: {layers['retrieval']['azureSearchFilter']}",
        "",
        "## Audit evidence",
        "",
        f"- Matrix: `{payload['auditEvidence']['matrixPath']}`",
        "- Append-only durable events with correlation identifiers.",
        "",
        "## Redaction",
        "",
    ]

    for note in redaction:
        lines.append(f"- {note}")

    lines.extend(["", "## Reference docs", ""])

    for rel in refs:
        lines.append(f"- `{rel}`")

    missing = payload.get("missingReferenceDocs", [])

    if isinstance(missing, list) and len(missing) > 0:
        lines.extend(["", "## Missing references (investigate)", ""])

        for rel in missing:
            lines.append(f"- `{rel}`")

    return "\n".join(lines) + "\n"


def write_pack(out_dir: Path) -> tuple[Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    payload = build_pack_payload()
    json_path = out_dir / "tenant-isolation-verification.json"
    md_path = out_dir / "tenant-isolation-verification.md"
    json_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(_render_markdown(payload), encoding="utf-8")
    return json_path, md_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate tenant isolation verification pack.")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Output directory (default: dist/tenant-isolation-verification-pack)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate references and print summary without writing files.",
    )
    args = parser.parse_args()

    payload = build_pack_payload()
    missing = payload.get("missingReferenceDocs", [])

    if isinstance(missing, list) and len(missing) > 0:
        print("tenant isolation verification pack FAILED: missing reference docs:", file=sys.stderr)

        for rel in missing:
            print(f"  - {rel}", file=sys.stderr)

        return 1

    if args.dry_run:
        print("tenant isolation verification pack dry-run: OK")
        return 0

    json_path, md_path = write_pack(args.out_dir.resolve())
    print(f"Wrote {json_path.relative_to(REPO_ROOT)}")
    print(f"Wrote {md_path.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
