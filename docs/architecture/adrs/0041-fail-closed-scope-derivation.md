> **Scope:** ADR 0041 — fail-closed tenant/workspace/project scope derivation on production-like hosts (TB-304).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0041: Fail-closed scope derivation on production-like hosts

**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Architecture / security review  
**Related:** [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md), TB-072, TB-276, TB-304

## Context

Per-tenant catalog routing (ADR 0037) prevents cross-tenant SQL access when `TenantId` is correct. Residual risk is **inward** scope leakage: requests that resolve to no scope, header-only scope, or well-known development defaults (`ScopeIds.Default*`) proceed as if scoped.

`HttpScopeContextProvider` previously fell back to `ScopeIds.DefaultTenant`, `DefaultWorkspace`, and `DefaultProject` whenever JWT claims and headers were absent — in all environments.

## Decision

1. **Source tracking:** `IScopeContextProvider.ResolveCurrentScope()` returns per-dimension `ScopeSource` (`Ambient`, `Claim`, `Header`, `Default`).
2. **Request gate:** `ScopeResolutionGuardMiddleware` runs after authentication on **production-like** hosts (`HostEnvironmentClassification.IsProductionOrStagingLike`). Non-allow-listed routes return **403** when any dimension source is `Header` or `Default`, or when an ambient override carries development-default GUIDs.
3. **Allow-list:** `[AllowUnscopedRoute]` (plus existing `/internal/` and health path skips) marks legitimately scope-free surfaces (marketing, webhooks, registration).
4. **Startup guard:** `ProductionSafetyRules.CollectScopeDerivationUnsafeInProductionLike` rejects `ArchLucidAuth:Mode=DevelopmentBypass` and `ArchLucidAuth:AllowTestActorHeaders=true` on production-like hosts (carve-out: ASP.NET Development + `ARCHLUCID_ENVIRONMENT=Staging` for integration tests).
5. **Development unchanged:** Non-production-like hosts keep default-scope convenience for local dev and CI.

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Middleware gate vs throwing provider | Clean 403 at HTTP boundary; singleton provider stays safe for deep persistence callers | Endpoint metadata required for allow-list; must register after auth |
| Reject header-only on prod-like | Closes IDOR where callers spoof `x-*-id` without token-bound scope | Clients must receive scope in JWT/API-key claims in production |
| Explicit `[AllowUnscopedRoute]` vs inferring `[AllowAnonymous]` | Architecture test keeps new endpoints honest; distinct from cross-tenant opt-out | Attribute boilerplate on marketing/webhook controllers |
| Default interface member on `IScopeContextProvider` | Test doubles need no churn | Host provider must explicitly override |

## Constraints

- Must reuse `HostEnvironmentClassification.IsProductionOrStagingLike` — no new environment taxonomy.
- Claims continue to win over headers in `HttpScopeContextProvider` (TB-072 IDOR mitigation).
- `AmbientScopeContext` background-job path unchanged; jobs must push non-default scope in production.
- No change to JWT issuance or auth scheme implementations in this ADR.

## Expected impact

| Area | Impact |
|------|--------|
| **Security** | Production-like hosts fail closed on silent/default/header-only scope; reduces workspace/project leak within a tenant catalog. |
| **Scalability** | Negligible — one middleware evaluation per request. |
| **Reliability** | Startup fail-fast on dangerous auth config; misconfigured prod hosts fail at boot rather than serving default-tenant traffic. |
| **Cost** | No additional infrastructure; engineering cost limited to attribute classification and tests. |

## Alternatives considered

1. **Throw inside `HttpScopeContextProvider`:** Rejected — singleton used deep in persistence; would surface as 500s.
2. **Require SQL RLS for scope:** Rejected — ADR 0037.
3. **Infer allow-list from `[AllowAnonymous]` only:** Rejected — anonymous telemetry and mixed controllers need explicit action-level opt-out; architecture test requires explicit attribute.

## Verification

- `ArchLucid.Architecture.Tests` — `FailClosedScopeDerivationArchitectureTests`
- `ArchLucid.Api.Tests` — `ScopeResolutionGuardTests`, `ScopeResolutionGuardMiddlewareTests`
- `ArchLucid.Host.Core.Tests` — `ScopeDerivationProductionSafetyRulesTests`, `HttpScopeContextProviderTests`
