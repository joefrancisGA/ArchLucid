# FND-010 SecureNow HTTP authorization wiring

The existing `GET /v1/evidence-graph/snapshot?secureNowExchange=true` branch now resolves a scoped `EvidenceReadAuthorizationGate` and requires a successful authorization decision **before the first `IRunRepository.GetByIdAsync` call**. The gate is registered in the API host. Missing gate, invalid principal, scope mismatch or policy denial returns a non-disclosing 404. The existing default snapshot route is unchanged. The existing server-side feature flag still must be enabled before this branch is reachable.

The initial resource ID used for authorization is the requested anchor **run ID**. The resolved historical graph snapshot may be a different run. Storage-level scope checks remain mandatory, and a separate authorization check for the resolved snapshot/evidence must be added before production activation. The existing `ReadAuthority` policy does not provide a per-evidence entitlement. Existing controller tests were adapted to supply an authenticated principal and gate, but other tests and integration suites must be reconciled.

**Release blockers:** required CI, OpenAPI snapshot compatibility, full real-HTTP cross-tenant test, authorization of resolved snapshot, and security review. This is not a claim of end-to-end authorization. No feature flag or production remediation was enabled.
