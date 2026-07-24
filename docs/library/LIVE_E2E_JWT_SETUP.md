> **Scope:** Contributor-reference — Live E2E — JwtBearer with a local RSA public key (CI / lab) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Live E2E — JwtBearer with a local RSA public key (CI / lab)

> **Install order moved.** See [INSTALL_ORDER.md](../engineering/INSTALL_ORDER.md) for base toolchain; this doc covers JWT/E2E-only configuration **after** install.

## Objective

Run Playwright **`live-api-*.spec.ts`** against **`ArchLucidAuth:Mode=JwtBearer`** when Entra metadata is unavailable, by validating JWTs with **`ArchLucidAuth:JwtSigningPublicKeyPemPath`** plus **`JwtLocalIssuer`** / **`JwtLocalAudience`**.

## Assumptions

- **Non-production only:** configuration validation rejects **`JwtSigningPublicKeyPemPath`** in Production (use Entra **`Authority`** + metadata there).
- **Claim shape:** tokens use short JWT claim names **`roles`** (array or repeated) and **`name`** aligned with **`LIVE_JWT_ACTOR_NAME`** (default **`JwtE2eAdmin`**). The API sets **`JwtBearerOptions.MapInboundClaims = false`** for this path so **`roles`** matches **`[Authorize]`** role checks.
- **Next.js BFF:** browser calls that go through **`archlucid-ui`’s API proxy** may not send **`Authorization`**; set **`ARCHLUCID_PROXY_BEARER_TOKEN`** to the same value as **`LIVE_JWT_TOKEN`** so the server attaches **`Authorization: Bearer`** upstream.
- **RSC / server `fetch`:** Run detail and other Server Components call the API **directly** (same origin as the proxy target, not via `/api/proxy`). **`getServerUpstreamAuthHeaders`** in **`archlucid-ui`** applies **`ARCHLUCID_PROXY_BEARER_TOKEN`** there too so JWT CI matches Playwright’s direct API auth.

## Constraints

- Issuer and audience on the API **must** match the mint script (`scripts/ci/mint_ci_jwt.py`).
- CI job **`ui-e2e-live-jwt`** is merge-blocking when enabled in **`.github/workflows/ci.yml`**; failures indicate JWT + UI proxy + RSC auth drift.
- **Private-beta gate:** **`ui-e2e-live-beta-access`** runs **`live-api-private-beta-access.spec.ts`** only, with **`NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer`** at build time and scope claims on the minted JWT — required before sending beta invites (TB-797).
- **Scope binding (TB-925):** mint tokens with **`tenant_id` / `workspace_id` / `project_id`** claims (see **`scripts/ci/mint_ci_jwt.py --tenant-id …`**). The private-beta suite asserts **`GET /v1/scope`** and **`GET /v1/admin/users/invitations`** return **403** when **`x-tenant-id`** disagrees with the JWT claim. Under **DevelopmentBypass** with **`AllowTestActorHeaders=true`**, scope headers are honored at authentication time for E2E isolation only — that path must not ship to beta (**`AuthSafetyGuard`**).
- **Invitee principal (TB-927):** the **`invitee Operator accept → session → create review`** test walks **`POST /v1/auth/bootstrap/invitations/accept`** under an invitee JWT (not the admin-minted **`LIVE_JWT_TOKEN`**). CI seeds a platform user via harness **`POST /v1/e2e/platform-users`** (**`LIVE_E2E_HARNESS_SECRET`** must match **`ArchLucid:E2eHarness:SharedSecret`**). **`LocalTrialJwtIssuer`** pre-auth and session tokens require **`Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath`** (same RSA private PEM as mint), **`JwtIssuer`**, and **`JwtAudience`** aligned with **`ArchLucidAuth:JwtLocalIssuer`** / **`JwtLocalAudience`**. Browser **`/api/proxy`** calls for invitee **`/api/auth/me`** must pass **`Authorization: Bearer`** from the invitee session token (proxy prefers the browser header over **`ARCHLUCID_PROXY_BEARER_TOKEN`**).
- **Beta readiness diagnostics (TB-928):** before sending beta invites, admins can call **`GET /v1/admin/auth/configuration-diagnostics`** (not **`/v1/admin/auth-configuration`**, which 404s). The response includes **`operatorBaseUrlConfigured`**, **`localTrialIdentityConfigured`**, and **`misconfigurationHints`** for **`Email:OperatorBaseUrl`** and **`Auth:Trial:LocalIdentity`**. The same signals appear on **Settings → Identity providers** setup checklist.

## Architecture overview

**Nodes:** OpenSSL (RSA keypair), Python (**PyJWT** + **cryptography**), SQL catalog, **`ArchLucid.Api`**, Playwright, optional Next **`webServer`**.

**Edges:** Private key → mint script → **`LIVE_JWT_TOKEN`**; public PEM → API env; Playwright → direct API or Next proxy with **`ARCHLUCID_PROXY_BEARER_TOKEN`**.

## CI constants (subset job)

| Setting | Value |
|---------|--------|
| SQL database | **`ArchLucidLiveE2eJwt`** |
| **`ArchLucidAuth:JwtLocalIssuer`** | `https://ci.archlucid.local` |
| **`ArchLucidAuth:JwtLocalAudience`** | `api://archlucid-live-e2e-jwt` |
| Nightly (full suite) | DB **`ArchLucidLiveE2eNightlyJwt`**, issuer `https://nightly.archlucid.local`, audience `api://archlucid-live-e2e-nightly-jwt` |

## Local quick test

1. Generate keys and mint a token (see **`scripts/ci/mint_ci_jwt.py --help`**).
2. Point the API at the **public** PEM and set issuer/audience to match mint args.
3. Export **`LIVE_JWT_TOKEN`** and **`ARCHLUCID_PROXY_BEARER_TOKEN`** (same string) before **`npx playwright test`** (default live config).

## Related links

- [LIVE_E2E_AUTH_PARITY.md](LIVE_E2E_AUTH_PARITY.md)
- [LIVE_E2E_AUTH_ASSUMPTIONS.md](LIVE_E2E_AUTH_ASSUMPTIONS.md)
- [LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md)
