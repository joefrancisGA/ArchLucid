# CA-13 — OpenAPI snapshot, generated client, route matrix

**Do not add product behavior.** HTTP from CA-11–12 must exist. Follow `Http-Surface-Docs-And-Clients.mdc`.

## Goal

Contract surfaces cannot drift from the new identity API.

1. Refresh OpenAPI v1 snapshot (`docs/library/OPENAPI_CONTRACT_DRIFT.md`).
2. Regenerate `ArchLucid.Api.Client` / `archlucid-ui` `api-types.generated.ts` via the repo scripts — **do not hand-edit generated files**.
3. `docs/library/API_CONTRACTS.md` row for list/get/PATCH.
4. `docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md` rows if a new controller was added.

## Why

CI will fail the push corset if snapshot and client disagree. A livelihood API that exists only in a controller is not shippable.

## Context

- `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`
- `docs/library/OPENAPI_CONTRACT_DRIFT.md`
- Pre-push hook notes in `docs/engineering/AGENTS.md`

## What to build

1. Snapshot + generate + docs rows.
2. Do not change RBAC in this prompt.

## Acceptance criteria

- `openapi-contract-snapshot` paths the team already uses would pass for the new operations (run the scoped snapshot test if that is the named verification).
- Generated types include architecture identity list/get.

## Constraints

- No full-solution build. No `npm ci` unless generate requires it — then say so.
- Do not implement BFF.
