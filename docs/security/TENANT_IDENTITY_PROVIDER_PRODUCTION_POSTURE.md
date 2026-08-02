# Tenant identity provider — production posture

**Date:** 2026-07-18  
**Audience:** Operators enabling enterprise SSO for a customer domain  
**Related:** ADR (host SAML), `docs/runbooks/PLATFORM_IDENTITY_SUPPORT.md` (§ [SSO enforcement and recovery drill](../runbooks/PLATFORM_IDENTITY_SUPPORT.md#sso-enforcement-and-recovery-drill-evidence-e3))

## Summary

| Capability | Production posture today | Notes |
|------------|--------------------------|--------|
| Host-level SAML | **Supported** when `AddArchLucidSaml2IfEnabled` is configured for the deployment | Shared host ACS / SP metadata |
| Host-level OIDC (Microsoft / optional Google) | **Supported** via env (`NEXT_PUBLIC_OIDC_*`, optional Google) | UI hides Google unless configured |
| Per-tenant IdP **metadata** (SAML/OIDC records) | **Supported** in admin + routing | Used for domain → IdP routing and diagnostics |
| Per-tenant **dynamic** auth middleware (hot-swap authority per tenant at runtime) | **Not** the default production model | Do not promise unlimited BYO IdPs without host wiring |
| Domain DNS verification | **Supported** | Required before SSO enforce |
| SSO enforcement + Email OTP deny | **Supported** (unit-tested) | Recovery admin / platform grant bypass audited |
| Email OTP passwordless | **Supported** | Not a routine SSO bypass when enforced |

## What to tell customers

- ArchLucid can enforce organizational SSO for a **verified email domain**.
- SAML/OIDC configuration is an **operator-guided** setup (diagnostics wizard + runbooks), not fully unattended multi-IdP SaaS for every tenant process.
- Break-glass recovery exists; last recovery admin cannot be removed without succession (see recovery drill).

## Evidence checklist (enterprise production YELLOW → GREEN)

1. One live customer IdP (SAML or OIDC) end-to-end under JwtBearer (not DevelopmentBypass).
2. DNS verify → route → enforce drill recorded.
3. SSO enforcement + recovery drill ([`PLATFORM_IDENTITY_SUPPORT.md`](../runbooks/PLATFORM_IDENTITY_SUPPORT.md#sso-enforcement-and-recovery-drill-evidence-e3)) pass.
4. Public marketing claims list only IdPs enabled in that environment.

## Security / reliability / cost

- **Security:** Prefer verified domain + enforce; inactive IdP fail-closed.
- **Scalability:** Host-level IdP wiring scales operationally; unbounded per-tenant middleware is deferred.
- **Reliability:** Document IdP outage degraded copy; keep recovery admins.
- **Cost:** Each additional host IdP increases cert rotation and metadata ops load.
