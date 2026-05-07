> **Scope:** Smoke validation for Azure architecture extractor upload path.

# Smoke — Azure extractor upload

**Primary enterprise demo connector (owner decision 2026-05-07):** customer-run extractor package + `POST /v1/azure-extractor/upload`.

## Prerequisites

- Hosted ArchLucid API reachable with an operator API key or equivalent auth used in your environment.
- Extractor package built from in-repo guidance — [runbooks/AZURE_EXTRACTOR_INGEST.md](../../runbooks/AZURE_EXTRACTOR_INGEST.md).

## Secrets

- Store API keys in **Key Vault** (production) or environment-specific secret stores — never in the recipe file.
- Local/dev may use `ARCHLUCID_API_KEY` when consistent with your `archlucid.json` / CLI configuration.

## Happy path (API)

1. Obtain a valid bearer/API-key combination for a tenant with extractor entitlement (per environment policy).
2. `POST /v1/azure-extractor/upload` with the packaged bundle per OpenAPI (`GET /openapi/v1.json`).
3. Expect **2xx** and a response body that includes correlation identifiers documented in the API contract.

## Verification

- **Audit:** filter audit export or SQL audit queries for extractor ingest event types for this tenant (see [AUDIT coverage docs](../../library/AUDIT_COVERAGE_MATRIX.md) for stable type names in your build).
- **Run association:** confirm a new or linked architecture run/request row appears in operator UI or via `GET /v1/architecture/run/{runId}` when the flow creates a run.

## Troubleshooting

- **401/403:** confirm tenant + role mappings and extractor feature flags per environment.
- **413/timeout:** reduce bundle size; ensure edge/WAF limits documented for your hosting profile ([docs/library/AZURE_PRODUCTION_PROFILE.md](../../library/AZURE_PRODUCTION_PROFILE.md)).
