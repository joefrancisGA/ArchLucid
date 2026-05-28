> **Scope:** Contributor-reference checklist for intentional OpenAPI contract and generated-client changes.

# OpenAPI and client drift — operator note

**Canonical contract:** `GET /openapi/v1.json` on the API host.

**Explorer Swagger** (if enabled) is a convenience view — integrators and CI must treat **`/openapi/v1.json`** as authoritative.

## Intentional API change checklist (contributors)

1. Edit the v1 controller/DTO source of truth.
2. Regenerate or update the snapshot under `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` when the public contract changes.
3. Run OpenAPI contract tests: `dotnet test ArchLucid.Api.Tests --filter FullyQualifiedName~OpenApiContract`.
4. Regenerate UI types / NSwag client when DTO shapes change (`archlucid-ui` generated types, `ArchLucid.Api.Client`).
5. Add a row to [`AUDIT_COVERAGE_MATRIX.md`](AUDIT_COVERAGE_MATRIX.md) for new mutating routes.

## Integrator note

- Pin client generation to the **`info.version`** field from `/openapi/v1.json`.
- Do not assume Swashbuckle document ordering matches snapshot ordering.
- Breaking changes are announced in [`BREAKING_CHANGES.md`](BREAKING_CHANGES.md).

## Related

- [`API_CONTRACTS.md`](API_CONTRACTS.md)
- [`CHANGE_IMPACT_SUMMARY_TEMPLATE.md`](CHANGE_IMPACT_SUMMARY_TEMPLATE.md)
