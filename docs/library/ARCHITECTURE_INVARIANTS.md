> **Scope:** Engineering-maintained catalog of cross-cutting architecture invariants ArchLucid intends to enforce via code, tests, and ops; audience is contributors and reviewers; not buyer-facing trust claims or a substitute for ADRs.

# Architecture invariant catalog

**Last updated:** 2026-05-09

**Normative decisions** that conflict with this catalog belong in a new or amended [Architecture Decision Record](../architecture/adrs/README.md); this file is the **checklist and ID registry** for enforcement work tracked in [`TECH_BACKLOG.md`](TECH_BACKLOG.md).

**Conformance today:** Mixed. Several invariants partially hold by convention only. Rows below state **intent**, **why it matters**, **enforcement sketch**, and **relation to shipped decisions** where applicable.

| ID | Invariant (one sentence) | Tier | Enforcement sketch |
|----|--------------------------|------|---------------------|
| [INV-001](#inv-001-tenant-identity-boundary) | Tenant identity is established once at the host boundary and passed as typed context; deeper layers never re-parse claims or ambient HTTP to infer tenant. | P0 | Analyzer + architecture tests + parallel-tenant integration tests |
| [INV-002](#inv-002-structural-execution-mode) | Every persisted agent outcome and buyer-visible run summary carries an explicit structural execution mode (Real / Simulator / Fallback / Mixed); “unknown” is invalid. | P0 | NOT NULL persistence + schema + OpenAPI/UI contract tests |
| [INV-003](#inv-003-audit-path-contracts) | User-visible transactional paths treat audit as part of the operation contract; informational async audit remains best-effort with retry + metrics per TB-001. | P1 | Narrow transactional tests + disallow silent drops on synchronous governance paths |
| [INV-004](#inv-004-durable-cost-guardrails) | LLM cost and quota reservations are coherent across replicas (durable or equivalent), with pre-call reservation and post-call settlement. | P1 | Dual-replica integration tests against one SQL budget row |
| [INV-005](#inv-005-production-host-fail-closed) | Staging / Production hosts fail fast when developer-only auth, missing production secrets disposition, or documented soft-guard misconfigurations are detected. | P0 | **Enforced** — `ConfigurationCatalogProductionProfileGuardParityTests` + `ProductionDangerousMisconfigurationLint` in `ArchLucidConfigurationRules` |
| [INV-006](#inv-006-single-composition-root) | Production DI registration for app lifetimes is owned by `ArchLucid.Host.Composition` only; stray `Add*` helpers elsewhere are forbidden or allow-listed. | P2 | **Enforced** — `SingleCompositionRootServiceCollectionExtensionsTests` |
| [INV-007](#inv-007-injected-time) | Clock reads use `TimeProvider` / `IClock` only; naked `DateTime*.UtcNow` banned in production assemblies (except clock adapter internals). | P2 | Roslyn analyzer |
| [INV-008](#inv-008-cancellation-forwarding) | Public async boundaries accept and forward `CancellationToken` through to I/O including LLM and connector HTTP. | P2 | Analyzer on `I*Service` + integration smoke |
| [INV-009](#inv-009-mutating-http-idempotency) | Non-idempotent HTTP mutations require natural idempotency keys or explicit `Idempotency-Key` handling with durable replay protection. | P2 | Filter / attribute + conformance tests |
| [INV-010](#inv-010-central-http--llm-clients) | Outbound HTTP and LLM clients use `IHttpClientFactory` / typed wrappers under the centralized resilience pipelines; raw `HttpClient` construction is forbidden. | P2 | Analyzer + composition tests |
| [INV-011](#inv-011-append-only-repository-shape) | Append-only domains (audit stream, immutable traces where applicable, outbox publishes) expose append/query only—no mutable `Update*` / `Delete*` repository APIs. | P2 | Interface architecture tests + REVOKE SQL where feasible |
| [INV-012](#inv-012-quality-gate-single-source-of-truth) | Quality gate outcome for a run is computed once, persisted with versioned thresholds, and read by API / UI / audit consumers—no silent recompute drift. | P1 | Typed aggregate + forbid duplicate evaluators downstream |
| [INV-013](#inv-013-replay-read-only-scope) | Replay reads the original run but writes outputs under a separate replay scope; original artefact hashes are unchanged after replay. | P2 | Integration hash assertions |
| [INV-014](#inv-014-no-mutable-statics) | `Application` and `AgentRuntime` carry no mutable static state; shared state lives in DI services with explicit lifetimes. | P2 | Analyzer |
| [INV-015](#inv-015-inbound-webhook-pipeline-order) | External webhooks run verify-signature → size-cap → rate-limit → schema-parse before dispatch to handlers. | P1 | Shared middleware pipeline + ordering tests |

**Tier legend:** **P0** — ship risk or trust regression if violated. **P1** — correctness / cost / security adjacent. **P2** — hygiene that prevents creep.

---

## INV-001: Tenant identity boundary

**Intent:** Exactly one derivation of tenant id per request scope; propagation via typed scope / parameters.

**Why:** Cross-tenant data access is irreversible reputational failure; aligns with mental model of [ADR 0003](../architecture/adrs/0003-sql-rls-session-context.md) (RLS as defense in depth, not the only control).

**Enforcement sketch:** Roslyn ban on `IHttpContextAccessor` / `ClaimsPrincipal` reads below API/Middleware layer except allow-listed parsers; parallel-tenant integration test.

---

## INV-002: Structural execution mode

**Intent:** Honest labeling of how outputs were produced; no silent mixing without `Mixed`.

**Why:** Buyers must not mistake simulator or fallback output for live model output (see also `docs/library/SONNET_AI_FUNCTIONALITY_REVIEW_BRIEF.md`).

**Enforcement sketch:** Non-null enum on wire + DB; aggregation rule documented in ADR 0035.

---

## INV-003: Audit path contracts

**Intent:** Distinguish **transactional** audit (must succeed or fail the user-visible operation) from **informational async** audit (best-effort).

**Why:** TB-001 explicitly ships best-effort async audit with metrics; inventing “always fail closed” would contradict that decision without a new ADR.

**Enforcement sketch:** Attribute or interface marker on operations; tests per class; document the split in runbooks.

---

## INV-004: Durable cost guardrails

**Intent:** Budget state visible across Container Apps replicas within a documented window; reconcile actual token usage after each call.

**Why:** Unit economics and abuse containment; assessment flags per-process-only trackers as multi-replica risk.

**Enforcement sketch:** SQL row with optimistic concurrency or equivalent; two-instance test harness.

**Shipped (product):** **`ILlmTenantBudgetRepository`** with daily token + monthly USD reserve/settle (`SqlLlmTenantBudgetRepository` / `InMemoryLlmTenantBudgetRepository`); see **`155_LlmMonthlyTenantBudgetPurchasedCapBump.sql`** for TB-014 additive cap bumps on the monthly row.

---

## INV-005: Production host fail-closed

**Intent:** `DevelopmentBypass` and similar keys cannot boot under Production/Staging-classified environments without an explicit break-glass flag with expiry.

**Why:** Single mis-set `ASPNETCORE_ENVIRONMENT` must not silently enable dev auth (see existing `ArchLucid.Host.Core/Startup/Validation` patterns).

**Enforcement sketch:** Extend startup validation rules + `StartupValidatorTests` + diff `ConfigurationKeyCatalog` vs validator registry in CI.

**Enforcement (2026-05-25):** `ProductionDangerousMisconfigurationLint` wired into `ArchLucidConfigurationRules.CollectErrors`; `ConfigurationCatalogProductionProfileGuardParityTests` (bidirectional catalog parity); `ProductionDangerousMisconfigurationLintTests` and `ArchLucidConfigurationRulesTests` fail-fast cases; advisory paths increment `archlucid_startup_config_warnings_total` (TB-002).

---

## INV-006: Single composition root

**Intent:** `ArchLucid.Host.Composition` owns production service registration; tests may differ but must mirror lifetimes deliberately.

**Why:** Prevents hidden singletons, captive dependencies, and test/prod wiring drift across 30+ projects.

**Enforcement sketch:** Architecture test allow-list for `IServiceCollection` extension methods.

**Enforcement (2026-05-25):** `SingleCompositionRootServiceCollectionExtensionsTests` scans product assemblies for public static `IServiceCollection` entry points; allow-list is `ArchLucid.Host.Composition` and `ArchLucid.TestSupport` only.

---

## INV-007: Injected time

**Intent:** Deterministic replay, stable idempotency keys, and testable budget windows.

**Enforcement sketch:** `TimeProvider` injection; analyzer ban on `DateTime.UtcNow` outside clock adapter.

---

## INV-008: Cancellation forwarding

**Intent:** Cancellations propagate to LLM and HTTP so runs do not leak cost after user abort.

**Enforcement sketch:** Analyzer on public async service surface; spot-check key orchestrators.

---

## INV-009: Mutating HTTP idempotency

**Intent:** Retries, Front Door, and scripted clients cannot double-spend runs or webhooks.

**Enforcement sketch:** Middleware + SQL-backed idempotency store for opted-in routes.

---

## INV-010: Central HTTP / LLM clients

**Intent:** All outbound calls inherit correlation, circuit breaking, and retry policy from [ADR 0005](../architecture/adrs/0005-llm-completion-pipeline.md) composition.

**Enforcement sketch:** Ban `new HttpClient()`; verify handler chain in registration tests.

---

## INV-011: Append-only repository shape

**Intent:** Forensic and regulatory value of append-only stores is preserved in the code API, not only in table GRANTs.

**Enforcement sketch:** Repository interface tests; optional SQL REVOKE for app principal.

---

## INV-012: Quality gate single source of truth

**Intent:** One persisted decision per run revision; consumers read, they do not re-derive thresholds from appsettings ad hoc.

**Why:** Avoids UI/API/audit contradictions when environments differ slightly.

---

## INV-013: Replay read-only scope

**Intent:** Original committed artefacts remain stable evidence for comparison and audit.

---

## INV-014: No mutable statics

**Intent:** Replica-safe behavior without hidden cross-tenant or cross-request caches.

---

## INV-015: Inbound webhook pipeline order

**Intent:** Reduce parser-DoS and signature-bypass bugs; aligns with TB-007 security theme and connector backlog.

**Enforcement sketch:** Single pipeline entry type; controllers must delegate through it.

---

## References

- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) — **TB-009** through **TB-012** enforcement waves  
- [ADR 0035 (Proposed)](../architecture/adrs/0035-architecture-invariant-catalog.md) — governance and acceptance  
- [`SONNET_AI_FUNCTIONALITY_REVIEW_BRIEF.md`](SONNET_AI_FUNCTIONALITY_REVIEW_BRIEF.md) — AI-path review questions overlapping INV-002  
- [`docs/NEXT_REFACTORINGS.md`](../NEXT_REFACTORINGS.md) — broader refactor backlog (orthogonal)
