# ABQ-28 — Schema-derived API fuzzing for `authz-scope`

**After ABQ-05 and ABQ-21 (shipped).** Do not lower the hunt-ready bar. Do not claim a CPA SOC 2 or third-party pen test. Do not hunt unless a generated case **fails on current code** (then fix that one case).

## Goal

A generator reads the **committed** OpenAPI snapshot, builds **valid-shape** HTTP requests, then sends them with the **wrong** tenant / workspace / project scope. Every in-scope operation must return **403 or 404**, never **200** (success with the victim’s data) and never **500** (unhandled). This is a contract test, not a live pentest.

## Why

`/al-bug` `authz-scope` hunts are hand-picked routes (`GET /v1/runs`, artifacts, findings). New controllers land with a snapshot refresh and no cross-tenant case. Schema-derived cases scale with the contract: when OpenAPI grows, the matrix grows. Existing smoke tests prove one SQL path; they do not walk the catalog.

## Context

Reuse; do not add a second OpenAPI parser:

- `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` — source of operations
- `ArchLucid.Api.Tests/OpenApiContractSnapshotTests.cs` / `OpenApiContractParseValidator.cs`
- `ArchLucid.Api.Tests/Security/TenantIsolationSmokeTests.cs` — tenant A vs B headers (`x-tenant-id` / workspace / project); SQL skip pattern
- `docs/security/AUTHORIZATION_BOUNDARY_TEST_INVENTORY.md` — existing factories (`ApiKeyReaderAndAdminArchLucidApiFactory`, `GreenfieldSqlApiFactory`)
- `ArchLucid.Cli/Commands/TenantIsolationNegativeTest*.cs` — live/offline probes; **do not** replace the CLI ship-gate; this prompt is Api.Tests
- `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc` when present
- ADR 0037 tenant isolation — keep
- Closed class `authz-scope` — tag only if you file a hunt-ready row later

Anonymous / marketing / trust-center routes that are **deliberately** `[AllowAnonymous]` must be **excluded** (or asserted 200 without tenant data). Use the snapshot’s security schemes + existing `OpenApiAudience` classifiers rather than a hand-maintained denylist of every public path — if a denylist is unavoidable, generate it from the snapshot’s `security` / audience extension and fail the test when a new anonymous path appears uncategorized.

## What to build

1. **Generator** (own types, one class per file under `ArchLucid.Api.Tests`):

   - Parse the committed snapshot (same loader as contract tests).
   - For each operation that requires auth **and** has a tenant/workspace-scoped resource id in path or body:
     - Build a **schema-valid** example body/query (required fields only; UUID placeholders).
     - Issue the request as **tenant B** against an id created as **tenant A** (or a well-known fixture id that belongs to A).
   - Assert status is `403` or `404`. `401` is acceptable when the factory’s wrong-tenant token is treated as unauthenticated — document which. **`200` + foreign payload is a failure. `500` is a failure.**
   - Cap runtime: start with **GET** (and maybe DELETE) on `/v1/**` resource-by-id operations. POST/PUT can wait unless cheap. Skip file-upload / SSE / webhook callbacks.
   - Do **not** hit real Azure. Use existing `WebApplicationFactory` + the SQL skip-when-unset pattern. If in-memory storage cannot enforce isolation, skip with the same reason string as smoke tests rather than false-passing.

2. **Allowlist of expected 404-without-authz** (probe hits a route that does not exist): keep tiny. A 404 that is “no such route” vs “no such resource in this tenant” should not be distinguished unless the body already documents it — **do not** parse problem-details English.

3. **`/al-bug`:** one Phase 1.1a sentence: for API zones, agents **may** run this test filter and paste failures as `(candidate) [class:authz-scope]` — still not hunt-ready without reachability. Picker: no score term for “fuzz coverage.”

4. Tests (the generator **is** the test):

```text
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter FullyQualifiedName~SchemaAuthz
```

Unit-test the generator without the host where possible: given a tiny OpenAPI fixture (3 paths: anonymous marketing GET, authenticated GET-by-id, unauthenticated health), classify which are in-matrix. Host test: one known isolated route still 403/404 for tenant B (reuse smoke’s Tenant B guids).

If SQL is required, `[Trait("Category", "Slow")]` and skip when env vars unset — do not add this filter to `dotnet-fast-core`.

## Acceptance criteria

- Snapshot is the catalog; adding a scoped GET-by-id to OpenAPI without a 403/404 case fails this test on the next run (or the uncategorized-anonymous guard fails).
- Deliberate public routes stay public. No new claim of third-party pen-test publication.
- Empty / skipped SQL environment does not fail CI (skip), matching smoke tests.
- No English-phrase signals in `al-bug-audit-proven-rows.py`.

## Constraints

- Do not run a live attacker against production. Do not store customer data in fixtures.
- Do not reopen G-ASSURANCE-02 / TB-136 as “this is the pen test.”
- Do not run `/al-bug`. Do not invent `PD-###`.
- Working-tree safety. Each class in its own file. Check nulls. No `ConfigureAwait(false)` in tests.
- Do not hide desktop review workspace tabs.
