# SecureNow resource-hub cache hardening (CACHE-01 through CACHE-03)

Applies to `archlucid-ui/src/lib/infra-evidence/infra-evidence-resource-hub-cache.ts`, the browser-only read-through cache for the resource evidence hub.

## CACHE-01: identity and authorization-context partition

Every reusable cache key includes **authenticated OIDC subject + effective proxy tenant/workspace/project scope + resource ID + snapshot/run/assessment/audit-snapshot/control query identity**, encoded as a structured JSON tuple (version `securenow-hub-v2`). Distinct principals and projects cannot reuse the same cached response. Switching scope or subject clears retained responses and active single-flight records; explicit OIDC token replacement, login and logout dispatch a browser event to evict entries even when the same subject signs in again.

When JWT mode, authenticated subject or any of the three scope identifiers is unavailable, **bypass both cache reuse and request coalescing**. This includes opaque API-key sessions, which do not expose a stable browser principal. These requests still reach the authoritative API. The key never stores access tokens. Server authorization remains mandatory; browser caching does not grant any permission and does not replace server-side scope checks. Cache identity does not encode every instantaneous permission or role revocation; entries have a 30-second TTL and are cleared when the local OIDC session transitions.

## CACHE-02: bounded retention

Retain a maximum of **64 entries**, at most **512 KiB estimated per entry**, and at most **4 MiB total estimated serialized UTF-16 payload**. A least-recently-used entry is promoted on hit; writes evict the oldest entries until both limits hold. Expired entries are pruned opportunistically at read/write, including stale entries that have not been individually read. These estimates are not exact JavaScript object-size or peak-memory measurements. No background timer, localStorage persistence, Redis dependency or tenant evidence logging was added.

The single-flight dictionary is separately capped at **64** tracked requests; excess requests bypass tracking, rather than growing the map without bound.

## CACHE-03: race-safe invalidation

Invalidate a specific key, all variants of a particular resource across its evidence query scopes, or the entire cache. Invalidation removes in-flight tracking so previous responses cannot repopulate cache entries. A completed request only deletes tracking if the tracked promise is **exactly that same promise**; a stale completion cannot discard a newer post-invalidation request. Responses in flight before invalidation can still fulfill their original callers, so UI components remain responsible for ignoring obsolete selection results.

## Validation

Vitest coverage: partition dimensions, unresolved-identity bypass, same-scope coalescing, principal/scope change, auth transition, 64-entry LRU, aggregate estimated-byte cap, oversized-value bypass, 30-second expiry, resource-wide invalidation, promise interleaving after invalidation, and cross-principal in-flight responses.

Command from `archlucid-ui`:

```sh
npm test -- src/lib/infra-evidence/infra-evidence-resource-hub-cache.test.ts
```

Passing tests and actual performance improvements must be verified in CI and workloads; commits alone are not evidence of a benchmark result. The changes apply only to this resource-hub UI cache; they do not modify general graph projection caches, SQL reads, or distributed Redis caching.
