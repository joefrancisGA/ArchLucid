> **Scope:** Contributor-reference — Generated maintainability boundary map — do not edit by hand.

# Maintainability boundary map (generated)

| Change type | Touch | Primary tests/docs |
| --- | --- | --- |
| API route or DTO | `ArchLucid.Api/Controllers, ArchLucid.Contracts` | ArchLucid.Api.Tests, docs/library/API_CONTRACTS.md, docs/library/CHANGE_IMPACT_CHECKLIST.md |
| Application service | `ArchLucid.Application` | ArchLucid.Application.Tests, docs/library/CONTRIBUTOR_CODE_MAP.md |
| Operator UI route | `archlucid-ui/src/app/(operator)` | archlucid-ui/src, docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md |
| Audit event semantics | `ArchLucid.Core/Audit/AuditEventTypes.cs` | docs/library/AUDIT_COVERAGE_MATRIX.md, scripts/ci/fixtures/audit_path_semantics.json |
| Policy pack seed content | `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled` | scripts/ci/check_policy_pack_content_quality.py, docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md |

Regenerate:

```bash
python scripts/ci/generate_maintainability_boundary_map.py
```
