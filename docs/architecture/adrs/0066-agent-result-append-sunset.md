> **Scope:** Contributor-reference ADR — sunset plan for `POST …/result` agent append path (**TB-1034**); not a buyer-facing assurance claim.

# ADR 0066: Agent result append path sunset (`POST …/result`)

**Status:** Accepted  
**Date:** 2026-08-12  
**Deciders:** Architecture review (owner)  
**Related:** [ADR 0042](0042-canonical-run-write-surface.md), [ADR 0030](0030-coordinator-authority-pipeline-unification.md), **TB-1034**, **TB-1007**, GTM **M-185**

**Engineering contract:** [`STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md`](../../library/STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md).

## Context

ADR 0042 § Decision 3 retained `POST /v1/architecture/review/{runId}/result` as an append-only custom-agent extension while constraining it to in-progress run states. Coordinator **storage** strangler is Done (**TB-919** / ADR 0030). The remaining dual-mental-model driver for integrators is teaching create→execute→**result**→commit as a peer default to Authority finalize.

First-party clients (UI, CLI) do not require `/result` for the product-default path. External custom-agent integrations may still push `AgentResult` rows via this route.

## Decision

1. **Authority remains product-default** for new surfaces after `POST /v1/architecture/request` (freeze checklist in **TB-1034** contract).
2. **Rename vocabulary:** “legacy coordinator” → **AgentTask / AgentResult extension loop** in contributor docs (not a second storage pipeline).
3. **Sunset `/result` in phases** (route removal is a follow-on implementation TB; this ADR owns the plan):
   - **Phase 0 (immediate):** No new product CTAs or integrator guides may require `/result` as the finish path.
   - **Phase 1 (next implementation TB):** Emit RFC 8594 `Deprecation: true` + `Link; rel="successor-version"` on `/result` pointing integrators to supported AgentTask patterns; update OpenAPI descriptions.
   - **Phase 2 (delete):** Remove the route after deprecation soak and explicit owner sign-off; require migration note for any external caller discovered in telemetry.
4. **Keep `execute` and task-owned finalize/commit`** for intentional AgentTask loops (simulator, trial, selective re-execute **TB-938**).
5. **Do not reopen** dual coordinator repositories, alias routes, or ADR 0042 alias deletion (**TB-919**).

## Trade-offs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Phased sunset vs immediate delete | Protects hypothetical external integrators | `/result` remains in OpenAPI until Phase 2 |
| Freeze vocabulary before route delete | Stops dual-default design drift early | Doc churn across Flow A surfaces |
| Keep execute/commit | Preserves Real/simulator and trial paths | Surface slightly larger than Authority-only |

## Constraints

- Append-only invariant from ADR 0042 §3 remains until route deletion.
- Public route deletion requires deprecation headers first (ADR 0006 posture).
- Historical ADRs are not rewritten — append status notes only.

## Expected impact

| Area | Impact |
| --- | --- |
| **Security** | No change to append-only guard until delete TB |
| **Scalability** | Negligible |
| **Reliability** | Clearer single default lifecycle reduces integrator misconfiguration |
| **Cost** | Engineering for deprecation middleware + eventual route removal |

## Verification

- **TB-1034** contract + Flow A doc renames
- **TB-1035** honesty CI (open) — dual-default / result-finalizes claims
- `RunStateTransitionServiceTests` — append-only invariant until delete
- `CanonicalRunWriteSurfaceArchitectureTests` — update when Phase 2 lands

## Alternatives considered

1. **Delete `/result` immediately.** Rejected — external custom-agent contract change needs deprecation window.
2. **Keep `/result` indefinitely.** Rejected — clearest remaining second-driver verb after storage strangler Done.
3. **Make `/result` canonical.** Rejected — contradicts Authority product-default and ADR 0042.
