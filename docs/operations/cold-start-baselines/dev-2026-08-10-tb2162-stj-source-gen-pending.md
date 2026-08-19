# Cold-start baseline — API JSON source generation (pending CD remeasure)

**Date:** 2026-08-10  
**Environment:** dev (next routine CD)  
**Commit:** pending capture after **TB-2162** merge  
**Change:** Per-slice `JsonSerializerContext` for auth/me, run list, findings keyset, audit keyset, and problem details; MVC + `ArchLucidApiJsonSerializerOptions` share the resolver chain.

## Expected hypothesis (not yet measured)

| Phase | Prior dev baseline | Expected direction |
|-------|-------------------|--------------------|
| **B — `/api/auth/me` after ready** | *Not captured* | **−100 to −400 ms** first-touch serialization on Phase B hot path (estimate) |
| **List endpoints (steady state)** | *Not baselined* | **−5 to −15% p95** on run/audit list reads after warm-up (estimate) |

## Rollback

Remove `ArchLucid.Api/Serialization/*ApiJsonSerializerContext.cs` and restore inline `AddJsonOptions` configuration in `MvcExtensions.cs`.

## Owner decision

**Keep** unless OpenAPI contract snapshot or wire-parity tests fail on deploy.
