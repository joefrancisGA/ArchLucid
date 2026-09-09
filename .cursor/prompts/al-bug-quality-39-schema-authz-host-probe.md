# ABQ-39 — One known-route schema-authz host probe

**After ABQ-28 (shipped catalog).** Do not walk the full OpenAPI catalog over HTTP. Do not claim a third-party pen test. Do not hunt unless this **one** probe fails on current code (then fix that case only).

## Goal

ABQ-28 classifies committed OpenAPI GET/DELETE-by-id (`SchemaAuthzFuzzCatalog`). Cross-tenant HTTP still lives only in `TenantIsolationSmokeTests`. Add **one** host probe that: creates a run as tenant A (same factory as smoke), then **GET** `/v1/architecture/review/{runId}` as tenant B, expecting **403 or 404** (not **200** with A’s payload, not **500**). `[Trait("Category", "Slow")]`. Skip when SQL env vars are unset — same reason string as smoke. Do **not** add this filter to `dotnet-fast-core`.

## Why

The catalog grows when OpenAPI grows; isolation is still one hand-written smoke. A generator that never sends HTTP cannot fail when a new in-matrix route leaks. A **full** matrix is out of scope (cost, SQL, pen-test shape). One known isolated route, reused Tenant B guids, proves the catalog’s `InAuthzMatrix` example is the same surface smoke already covers — and gives `/al-bug` a paste-ready filter if it ever 200s.

## Context

- `ArchLucid.Api.Tests/Security/SchemaAuthzFuzzCatalog.cs` — GET `/v1/architecture/review/{runId}` is in-matrix
- `ArchLucid.Api.Tests/Security/TenantIsolationSmokeTests.cs` — Tenant B guids, `GreenfieldSqlApiFactory`, skip probe
- `docs/security/AUTHORIZATION_BOUNDARY_TEST_INVENTORY.md`
- `.cursor/commands/al-bug.md` — catalog filter sentence already exists; add “host probe is Slow/SQL skip”
- ADR 0037 / `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc` — do not reopen RLS
- Closed class `authz-scope` — tag a hunt-ready row only if this probe **fails** and you file a candidate (do not invent `PD-###`)

Each new type in its own file. No `ConfigureAwait(false)` in tests.

## What to build

1. **`SchemaAuthzKnownRouteHostTests`** (name may vary) under `ArchLucid.Api.Tests/Security/`:

   - Reuse smoke’s SQL skip + wire-scope helpers (extract a shared helper **only** if both files would otherwise duplicate >~15 lines; otherwise copy the skip/wire pattern to avoid a drive-by smoke rewrite).
   - One `[SkippableFact]`: tenant A creates a run; tenant B GET review-by-id; status in `{403, 404}`; if 200, fail (do not parse problem-details English).
   - Optional: assert the path is `InAuthzMatrix` via `SchemaAuthzFuzzCatalog` on the committed snapshot so catalog drift cannot silently drop the route.

2. **Do not** loop all in-matrix operations. POST/PUT, uploads, SSE, webhooks stay skipped.

3. **Docs:** inventory table one row; command: this is not G-ASSURANCE-02.

4. Tests:

```text
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter FullyQualifiedName~SchemaAuthz
```

Empty SQL env must **skip**, not fail (run once without the env vars to prove it).

## Acceptance criteria

- Catalog tests still pass without SQL.
- Host probe skips when SQL is down; fails only on 200/500 when SQL is up.
- No live attacker, no production, no customer fixtures.
- Do not treat this as a published pen test.

## Constraints

- Do not reopen G-ASSURANCE-02 / TB-136.
- Do not run `/al-bug`. Do not invent `PD-###`.
- Working-tree safety. Check nulls. Blank line before `if`/`foreach` unless first in method.
- Do not hide desktop review workspace tabs.
