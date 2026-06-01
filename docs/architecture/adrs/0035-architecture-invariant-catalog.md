> **Scope:** ADR 0035 — Architecture invariant catalog and enforcement program — full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0035: Architecture invariant catalog and enforcement program

- **Status:** Proposed *(owner accepts by moving Status to Accepted; enforcement waves may merge before acceptance when each wave is independently safe)*
- **Date:** 2026-05-09
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** *(none)*

## Context

The codebase is large (↑30 assemblies), heavily instrumented for agents and connectors, and multi-tenant. Several cross-cutting guards (startup validation, RLS session context per [ADR 0003](0003-sql-rls-session-context.md), LLM pipelines per [ADR 0005](0005-llm-completion-pipeline.md)) exist, but **desired invariants today mix convention, tests, and documentation** rather than repeatable CI gates. External reviews repeatedly surface the same risk themes: tenancy clarity, execution-mode honesty, multi-replica cost accounting, webhook ordering, and production misconfiguration resilience.

Separate decisions have already narrowed some areas (example: **`TB-001`** — async informational audit is **best-effort** with retries and metrics rather than failing user flows). Any invariant that contradicts **`TB-001`** or another accepted backlog decision requires **that decision to be reopened via a superseding ADR or backlog amendment**, not silent reinterpretation below.

## Decision

1. Maintain a **single catalog** of invariant IDs **`INV-001` … `INV-015`** in [`docs/library/ARCHITECTURE_INVARIANTS.md`](../../library/ARCHITECTURE_INVARIANTS.md).

2. Route enforcement implementation through [`docs/library/TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md) items **`TB-009` … `TB-012`**, prioritized in waves documented there.

3. When an invariant graduates to enforced status, cite it in PR descriptions and tie tests or analyzers to the **INV** ID.

4. **Concurrency with OpenAPI**: any INV that changes externally visible behaviour must follow the HTTP surface rule (canonical `GET /openapi/v1.json`, snapshot + client regen) — see [`docs/library/API_CONTRACTS.md`](../../library/API_CONTRACTS.md) and [`docs/library/OPENAPI_CONTRACT_DRIFT.md`](../../library/OPENAPI_CONTRACT_DRIFT.md).

5. **`INV-003` default interpretation** honours **`TB-001`**: transactional vs informational audit paths remain distinct until a superseding backlog item merges.

## Consequences

- **Positive:** Shared vocabulary for reviewers; backlog rows map to actionable gates; aligns agent-path honesty questions with persisted structures.
- **Negative:** Analyzer and architecture-test work consumes compile/CI budget; staged waves avoid boiling the ocean.
- **Follow-ups:** After pilot evidence, Accepted status may tighten **INV-011** toward database GRANT reinforcement per environment.

### Execution mode aggregation *(normative sketch for INV-002)*

When per-agent modes differ inside one run:

- **`Real`** iff every agent invocation that produced a persisted result did so under the real completion path for that invocation.
- **`Simulator`** iff every persisted result was simulator-produced.
- **`Fallback`** iff any path used the documented fallback completion client exclusively for that invocation (no simulator).
- **`Mixed`** for any heterogeneous combination—including real + simulator, real + fallback, or labelled partial degradation per implementation rules.

Concrete enum names and serialization may evolve; **absence of mode remains invalid**.

## Links

- [`docs/library/ARCHITECTURE_INVARIANTS.md`](../../library/ARCHITECTURE_INVARIANTS.md)
- [`docs/library/TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md) — **`TB-009` … `TB-012`**
- [`TEMPLATE.md`](TEMPLATE.md) — ADR authoring skeleton
- [ADR README](README.md) — numbering and immutability
