# FND-011 HTTP and OpenAPI verification increment

## Changes
- Controller-level positive exchange test: enabled feature, scope derived from `IScopeContextProvider`, read-only response.
- Negative tests: disabled gate prevents repository reads; graph exceeding existing node limit returns HTTP 413; legacy response type is unchanged.
- HTTP integration smoke tests use the repository's existing `ArchLucidApiFactory` and exercise disabled exchange and default unknown-run behavior through routing/middleware.
- Removed duplicate `[ProducesResponseType]` 200 metadata on the temporal endpoint so the original documented response remains canonical. The optional `secureNowExchange` query parameter still changes the OpenAPI surface; regenerate and compare the official OpenAPI snapshot before merge.

## Verification limits
- HTTP tests cover **feature-disabled** and **unknown-run** behavior, not a seeded two-tenant positive/negative graph fixture. They do not establish full cross-tenant isolation for a populated repository.
- No GitHub CI pass or OpenAPI snapshot refresh is claimed until actual workflow results are inspected.
- This is a stacked branch on `integration/fnd011-authorized-http-boundary`, which itself depends on `integration/fnd011-dotnet-snapshot-projection` and FND-011 schema PR #7659.
- No feature flag was enabled in deployed configuration; no customer mutation is possible through this read-only endpoint.

## Release blockers
1. Required CI and security checks pass.
2. Official OpenAPI snapshot refreshed/approved; optional query parameter reviewed for backward compatibility.
3. Add authenticated seeded two-tenant HTTP tests to prove A cannot read B, and test sealed-manifest and graph-size behavior over the HTTP pipeline.
4. Confirm response against FND-011 JSON Schema after contract PR is merged.
