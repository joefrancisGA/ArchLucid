# OP-04 — Architecture-only route 403 (same host)

**Do not** add a second host. **Do not** 403 `both` or `disputed` map rows. **Do not** 403 `/health/*` or `/openapi*`. **Do not** change INV-006.

Depends on **OP-01** map and **OP-03** signal. If either is missing, stop.

## Goal

When effective product line is **`security`**, Architecture-only API routes return **403** with a problem+json body. Shared (`both`) routes still work. Local dual-UI: Security website sends the OP-03 header; Architecture website omits it (deployment `both`) and keeps calling runs.

## Why

The Security shell’s Next.js route gate is not an API boundary. Buyers who want “SecureNow cannot call Architecture APIs” need this on the existing host. Same-binary two-deploy (`ProductLine:Deployment=security`) also starts working without a second csproj.

## What to build

1. Middleware or endpoint filter **after** authentication for authenticated API routes. Anonymous health/openapi/auth-challenge paths skip the gate (use OP-01 `alwaysAllowedRoutePrefixes` plus existing auth endpoints you discover — list them in tests).
2. Resolve the matched endpoint’s controller `typeName` → OP-01 row.
   - Missing map row → **fail closed in Development/test** (500 with “unmapped controller”) so new controllers cannot ship ungated; **fail open to `both` in Production** is **not** acceptable either — prefer fail closed everywhere if the map coverage test is in CI. If you must fail open, only for endpoints with no controller (minimal APIs). Document the choice in a one-file comment.
   - `productLine=architecture` and effective line `security` → 403.
   - `productLine=security` and effective line `architecture` → 403 (symmetric; extract-upload and any Security-only rows).
   - `both` / `disputed` → allow.
3. 403 body: existing problem-details helper if there is one. Message: product line cannot use this route. Do not leak internal map JSON.
4. Tests:
   - Unit: middleware matrix (security+runs → 403; security+findings/`both` → next; architecture+runs → next; disputed → next; health → next).
   - One `WebApplicationFactory` (or existing Api.Tests host) case if cheap: DevelopmentBypass + header `security` + a known architecture route vs a known `both` route. Reuse `ArchLucid.Api.Tests` fixtures; do not invent a second factory.
5. UI: Security 403 page already exists for nav misses; API 403 should surface through the existing proxy error path. Do **not** restyle. Add a Vitest only if the proxy strips the problem body today — otherwise skip UI.

## Acceptance criteria

- Security effective line cannot call `RunsController` (or equivalent mapped architecture route).
- Security effective line can call a mapped `both` findings or infra-evidence route.
- Architecture effective line can still call runs.
- Unmapped controller cannot be added without OP-01 test failure (already true) **and** the gate does not silently treat it as `both` in test hosts.

## Constraints

- Do not use UI pathname catalog as the API matcher. Match **controller type** (or route template recorded in the map). If you need route templates, add an optional `routePrefixes` array on the JSON in this prompt and extend OP-01 coverage tests — do not keep a second list in C#.
- Do not 401 (that implies re-auth). This is 403.
- Do not block Worker, CLI in-process, or gRPC — HTTP only.
- One class per file. No `ConfigureAwait(false)` in tests. Blank line before `if` unless first in method.
- Scoped tests only. If OpenAPI documents error responses for 403, keep it additive.
- Do not shuffle `product-line-catalog.ts`.
