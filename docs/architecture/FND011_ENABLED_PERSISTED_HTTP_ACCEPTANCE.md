# FND-011 enabled-exchange persisted HTTP acceptance test

## Added
`SecureNowEnabledPersistedHttpTests` uses a dedicated `ArchLucidApiFactory` subclass that sets `FeatureManagement:SecureNow.ReadOnlySnapshotExchange=true` **only inside the test host**. It seeds an authority run and graph through the existing `AdvisoryIntegrationSeed` repository chain. Two HTTP clients then request the same persisted graph:
- Owner (default integration scope): **must** receive 200, deserialize a `SecureNowSnapshotEnvelope`, and match the seeded run and tenant.
- A separately provisioned tenant/workspace/project: **must** receive 404.

Unlike the previous persisted test, owner 409 is **not** accepted. This test intentionally fails if the seeded manifest or temporal guards prevent a valid owner read. It is included in the focused workflow.

## Verification still needed
- GitHub CI must execute the test and demonstrate a passing result; adding the assertion is not proof of success.
- The official OpenAPI v1 snapshot remains unrefreshed. The focused workflow runs `scripts/ci/check_openapi_contract_snapshot.sh`; if drift is detected, run `scripts/ci/update_openapi_contract_snapshot.sh` in a provisioned build environment and commit the reviewed generated snapshot and client updates.
- Security and merge protection checks must pass before merge.
- The factory uses development test-actor headers, not production OIDC tokens. A production-authentication test is a separate release gate.

The feature flag remains off in deployed configuration. No customer writes.
