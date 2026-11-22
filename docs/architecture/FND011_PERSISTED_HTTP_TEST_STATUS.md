# Persisted tenant HTTP verification — current limits

This branch adds `SecureNowPersistedTenantHttpTests`, which seeds an authority snapshot chain via `AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(factory.Services)` in the existing API integration host. It provisions a second tenant/workspace/project in the same test SQL catalog, sends two real HTTP requests for the seeded run, and requires the foreign tenant to receive 404. The owner response currently accepts 200 **or** 409 because the seeded manifest may not meet the temporal pin/sealed-manifest guard; therefore this is not yet a positive 200 proof.

The test uses the existing default snapshot response because the SecureNow feature remains disabled in the test host. It does **not** establish enabled-exchange cross-tenant isolation. A future test must configure the feature flag explicitly in an isolated host, seed a valid sealed manifest and verify owner 200 and foreign 404.

OpenAPI drift check is wired into CI but no regenerated snapshot has been committed. Run `bash scripts/ci/update_openapi_contract_snapshot.sh` in a fully provisioned host and commit/review the generated artifacts. Existing OpenAPI refresh and integration workflows were queued when checked.

Do not enable the feature or merge without required CI/security gates. This is progress toward the release gate, not completion of the gate.
