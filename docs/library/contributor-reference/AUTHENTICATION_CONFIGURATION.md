> **Scope:** Contributor-only authentication, authorization, and HTTP protection configuration. Not customer-facing help.
>
> **Status:** current

# Authentication and authorization configuration

Engineering reference for ArchLucid API authentication modes, role mapping, and related HTTP controls. Customer-facing role guidance lives in [`../customer-facing/USERS_AND_ROLES_GUIDE.md`](../customer-facing/USERS_AND_ROLES_GUIDE.md) and in-app `/help/users-and-roles`.

## Shipped auth defaults (`appsettings.json` / `appsettings.Development.json`)

- **`ArchLucid.Api/appsettings.json`** (all environments unless overridden): **`ArchLucidAuth:Mode`** is **`ApiKey`**, with **`Authentication:ApiKey:Enabled`** **`false`** and **`DevelopmentBypassAll`** **`false`**. In that combination the API uses the API key authentication scheme but **rejects unauthenticated requests** until operators set **`Authentication:ApiKey:Enabled=true`** and configure **`AdminKey`** / **`ReadOnlyKey`** (or supply equivalent environment variables / Key Vault). This is **fail-closed** for accidental deployments that only ship base JSON.
- **`ArchLucid.Api/appsettings.Development.json`** (merged when **`ASPNETCORE_ENVIRONMENT=Development`**, including CI and local **`dotnet run`**): sets **`ArchLucidAuth:Mode`** back to **`DevelopmentBypass`** for frictionless local and test factories. **`Authentication:ApiKey:DevelopmentBypassAll`** stays **`false`** so the “open API key path” bypass is not the default even in Development.
- **`appsettings.Production.json`** / **`appsettings.Staging.json`** continue to set **`JwtBearer`** with Entra-style **configuration samples** (non-secrets); **`docker-compose.yml`** still sets **`ArchLucidAuth__Mode=DevelopmentBypass`** explicitly for the compose dev stack.

**Optional JWT bearer-only production (regulated SaaS):** set **`ArchLucidAuth:RequireJwtBearerInProduction=true`**. When **`ASPNETCORE_ENVIRONMENT=Production`**, **`ArchLucidConfigurationRules`** then requires **`ArchLucidAuth:Mode=JwtBearer`** (API keys are rejected at startup). Default is **`false`** so pilots may keep **`ApiKey`** in production until they cut over to **OIDC / JWT bearer** (**[V1_SCOPE.md](../V1_SCOPE.md) §2.12**).

**OIDC issuers beyond Entra (V1 GA):** **`JwtBearer`** accepts tokens from **configurable OIDC authorities** when **`ArchLucidAuth:Authority`** targets a standards-compliant issuer (discovery + JWKS). Claim mapping into **`ArchLucidRoles`** is operator-owned — capture buyer IdP shapes in procurement questionnaires (**[BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq](../../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq)**). Operator checklist: **[GENERIC_OIDC_SETUP.md](../../runbooks/GENERIC_OIDC_SETUP.md)**.

**Native SAML 2.0 SP (V1 GA — owner 2026-05-15):** Workforce SSO via SAML **Service Provider** flows ships alongside **`JwtBearer`** OIDC (**[V1_SCOPE.md](../V1_SCOPE.md) §2.12**). Operators enable it with **`ArchLucidAuth:Saml2:Enabled=true`** and bind **`ArchLucidAuth:Saml2`** (**SP issuer**, **IdP metadata** URL, optional **signing certificate** for outbound AuthnRequests, and inbound claim mapping — see **[CONFIGURATION_REFERENCE.md](../CONFIGURATION_REFERENCE.md)**).

- **Coexistence with API auth:** **`ArchLucidAuth:Mode`** still selects the primary scheme for **`DefaultAuthenticateScheme`** / **`DefaultChallengeScheme`** / **`DefaultForbidScheme`** (**JwtBearer**, **ApiKey**, or **DevelopmentBypass**). SAML uses the cookie handler’s **`DefaultSignInScheme`** / **`DefaultSignOutScheme`** so browser SSO can complete without replacing API bearer defaults.
- **RBAC and isolation:** SAML assertions are normalized onto the same **`ArchLucidRoles`** / permission claim path as JWT (**`ArchLucidSamlInboundClaimsNormalizer`** + **`ArchLucidRoleClaimsTransformation`**); tenant/workspace/project **`Guid`** claims remain operator-mapped via claim types in **`ArchLucidAuth:Saml2`**.
- **Durable audit (sign-in outcomes):** Successful SAML cookie issuance appends **`Saml2ServiceProviderSignInSucceeded`** to **`dbo.AuditEvents`**; ITfoxtec **SAML protocol** faults on **`/Auth`** paths append **`Saml2ServiceProviderSignInFailed`** (best-effort in the global exception path — failures there must never mask the underlying error).

## DevelopmentBypass production guard

`ArchLucidAuth:Mode=DevelopmentBypass` is allowed only when **`IHostEnvironment.IsDevelopment()`** is **true** (see **`AuthSafetyGuard`**). **`Authentication:ApiKey:DevelopmentBypassAll=true`** is permitted only in that same **Development** host — it throws **`InvalidOperationException`** in **Staging**, **Production**, **Test**, and other non-Development environment names, even when **`ArchLucidAuth:Mode`** is **`JwtBearer`** or **`ApiKey`**.

For **DevelopmentBypass** specifically, misnamed hosts are still blocked when **`ASPNETCORE_ENVIRONMENT`** / **`ARCHLUCID_ENVIRONMENT`** imply production-like deployments (**contains `prod`**, excluding **`non-production`**).

This section summarizes **`GuardAllDevelopmentBypasses`**. **`AuthSafetyGuard.GuardDevelopmentBypassInProduction`** remains an alias with the same checks.

This is in addition to **`ArchLucidConfigurationRules.CollectErrors`**, which still surfaces the same misconfiguration in logs when validation runs after the host is built. Use **`JwtBearer`** or **`ApiKey`** in real hosted environments, with **`DevelopmentBypassAll=false`**.

## Role-based access control (RBAC)

JWT **`roles`** / **`ClaimTypes.Role`** and DevelopmentBypass **`ArchLucidAuth:DevRole`** use the names in **`ArchLucid.Core.Authorization.ArchLucidRoles`**. Authorization policies are registered in **`ArchLucid.Host.Core.Startup.ArchLucidAuthorizationPoliciesExtensions.AddArchLucidAuthorizationPolicies`** and referenced from controllers via **`ArchLucid.Core.Authorization.ArchLucidPolicies`**.

**Trial-tier auth:** optional **`Auth:Trial:Modes`** enables **Entra External ID (CIAM)** consumer sign-in and/or **local email/password** backed by SQL; minted trial JWTs still carry **`ArchLucidRoles`** so **`ReadAuthority`** / **`ExecuteAuthority`** behave the same as workforce Entra tokens. See **`docs/security/TRIAL_AUTH.md`** and **ADR 0015**.

| Role (`ArchLucidRoles`) | Claim value | Typical access |
|-------------------------|-------------|----------------|
| **ReadOnly** / **Reader** | `Reader` | Read runs, manifests, governance reads, audit list/search, provenance, retrieval (policy **`ReadAuthority`** / **`RequireReadOnly`**). |
| **Operator** | `Operator` | ReadOnly capabilities plus create runs, replay, compare, exports that are not admin-only, alert mutations (**`ExecuteAuthority`** / **`RequireOperator`**). |
| **Admin** | `Admin` | Operator capabilities plus policy packs, advisory schedules, system configuration surfaces protected with **`AdminAuthority`** / **`RequireAdmin`**. Tenant-scoped admin routes (`/v1/admin/reference-evidence`, `/v1/admin/metering/summary`) resolve tenant from ambient scope — not platform cross-tenant targeting (TB-279). |
| **Auditor** | `Auditor` | Read-only scope plus **`GET /v1/audit/export`** and other endpoints that require **`RequireAuditor`** (Auditor or Admin role). |

**Cross-tenant analytics (TB-282):** Fleet-wide rollups and internal cross-tenant analytics require **`PlatformCrossTenantReadAuthority`** (`platform:cross-tenant-read` claim on **`PlatformOperator`**). Tenant **Admin**, **WorkspaceAdmin**, and tenant **Operator** principals receive **403**.

**Vendor-staff internal operations:** Cross-tenant diagnostics, fleet inboxes, and Internal Operations UI surfaces require **`PlatformInternalOperationsAuthority`** (`PlatformOperator` role or `platform:cross-tenant-read` claim). Tenant **Admin** does **not** satisfy this policy — use **`AdminAuthority`** for customer Administration (`/administration/*`) only.

Fine-grained **`permission`** claims (for example **`commit:run`**, **`export:consulting-docx`**) are still issued by **`ArchLucidRoleClaimsTransformation`** so existing permission policies remain meaningful for JWT and DevelopmentBypass. **ApiKey** mode maps keys to **Admin** or **Reader** roles only; use JWT with an **Auditor** app role when audit export is required for a principal.

## HTTP rate limiting (role-aware)

**`fixed`** and **`expensive`** ASP.NET rate-limit policies partition buckets by **resolved role segment + client IP** (`RateLimitingRolePartitionBuilder`). Base permit counts come from **`RateLimiting:FixedWindow:*`** and **`RateLimiting:Expensive:*`**; the shipped default for **`fixed`** is **60 requests per minute** per partition when **`RateLimiting:FixedWindow:PermitLimit`** is not overridden. Optional multipliers are in **`RateLimiting:RoleMultipliers`** (**`Admin`**, **`Operator`**, **`Reader`**, **`Anonymous`**), clamped in code to a safe range. **ApiKey** and JWT principals inherit the same **`IsInRole`** checks, so automation keys mapped to **Admin** receive a higher budget than anonymous traffic.

## Related reads

- **[CONFIGURATION_REFERENCE.md](../CONFIGURATION_REFERENCE.md)** — configuration keys and environment variables.
- **[LIVE_E2E_JWT_SETUP.md](../LIVE_E2E_JWT_SETUP.md)** — local JWT signing for integration tests.
- **[GENERIC_OIDC_SETUP.md](../../runbooks/GENERIC_OIDC_SETUP.md)** — OIDC operator checklist.
- **[SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md](../../runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md)** — SAML certificate rotation.
