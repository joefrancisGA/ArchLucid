> **Scope:** Contributor-reference — INV-004 reserve/settle lifecycle guarantees and residuals (TB-975); not a buyer-facing trust claim.

# INV-004 reserve/settle lifecycle contract

**Status:** Active (V1)  
**Backlog:** **TB-975** (this contract) · **TB-976** (durable per-reservation leases + orphan reclaim — open) · **TB-977** (SQL-owned UTC period + admission fairness — **Done** 2026-08-11)  
**Audience:** Principal architects, FinOps reviewers, platform reviewers, coding agents  
**Related:** [ARCHITECTURE_INVARIANTS.md](./ARCHITECTURE_INVARIANTS.md) (**INV-004**) · [LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md](./LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md) (**TB-1287**) · [LLM_BUDGET_TOP_UP.md](./LLM_BUDGET_TOP_UP.md) (**TB-014**) · [PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md](./PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md) (**TB-1570**) · ADR [0005](../architecture/adrs/0005-llm-completion-pipeline.md) · GTM **M-131** / **M-132** · Done **TB-011** / **TB-894** / **TB-939**

---

## 1. Purpose

Name what **INV-004** reserve/settle guarantees under live multi-replica concurrency — and which lifecycle failures remain until **TB-976** ships.

**One line:** **Hard cap is cap-correct under concurrent writers**; **settle is best-effort on the happy path**; **orphan reserved pressure is a documented residual**; **monthly period membership is SQL-authoritative** (**TB-977**); **in-flight admission fairness limits assumed-max soft-DoS** (**TB-977**).

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Crash-proof settle” / “A crash always releases reserved USD.” | Reserve increments durable `ReservedAssumedUsd` / `ReservedAssumedTokens` before the provider call; process death before `SettleAsync` leaves pooled reservation until **TB-976** reclaim. |
| “Exactly-once provider billing.” | Budget admission ≠ provider invoice; process skip after persist is **M-170** — separate contract. |
| “No race soft-DoS on the budget path.” | N concurrent calls each reserving **assumed-max** can still fill the reserved pool if they bypass the in-flight admission gate — cap remains correct; fairness is bounded by `MaxConcurrentInFlightMonthlyReservations` (**TB-977**). |
| “Month boundary is always SQL-authoritative today.” | Monthly period keys are decided at reserve via SQL `SYSUTCDATETIME()` (**TB-977**); daily token windows still use app `TimeProvider` until a follow-on. |
| “Quick Scan and paying-tenant monthly budgets use the same reservation model.” | Quick Scan (**TB-894**) uses **per-reservation `Guid` + TTL + commit/release**; monthly/daily tenant budgets use a **pooled counter** on one SQL row per period. |
| “Warn/kill + monthly cap = mature FinOps.” | Chokepoint accounting and bypass forbid list live under **TB-1287** / **M-226** — not this lifecycle contract. |

---

## 3. Lifecycle phases

| Phase | When | Durable effect | In-process state |
|-------|------|----------------|------------------|
| **Reserve** | Before provider call | `ReservedUsd` / `ReservedTokens` += assumed estimate on period row (`ROWVERSION` CAS) | `AsyncLocal` pending amount on monthly tracker (`PendingReservedAssumedUsd`) |
| **Call** | Provider completion | None on budget row | — |
| **Settle** | After call (success path) | `CommittedUsd` / `TokensConsumed` += actual; reserved -= released assumed | Clears pending when `ReleaseReservedUsd` matches reserve |
| **Skip settle** | Crash, kill, or code path that never records usage | Reserved amount **stays** on SQL row | `AsyncLocal` lost with process |

**Pressure formula:** `TotalUsdPressure = CommittedUsd + ReservedUsd` (and token analogue). Admission compares `TotalUsdPressure + nextAssumed` against effective hard cap (configured cap + **TB-014** `PurchasedCapBumpUsd`).

---

## 4. Guarantees vs non-guarantees

| Guaranteed today (V1 intent) | Not guaranteed (residual) | Owner |
|------------------------------|---------------------------|-------|
| Multi-replica hard-cap bypass blocked under concurrent reserve/settle | Orphan reserved USD/tokens after crash between reserve and settle | **TB-976** |
| Optimistic concurrency (`ROWVERSION`) on reserve and settle paths | Automatic orphan TTL / paid-unsettle reconcile without durable reservation id | **TB-976** |
| Fail-closed admission when `Total*Pressure + assumed > effectiveMax` | — | — |
| Per-tenant in-flight reservation ceiling before monthly reserve (**TB-977**) | — | — |
| SQL-owned UTC month period on monthly reserve (`SYSUTCDATETIME()`) (**TB-977**) | Daily period keys still from app `TimeProvider` | daily follow-on |
| Single monthly SQL row per `(TenantId, UtcYear, UtcMonth)` when period key is consistent | — | — |
| Run-scoped batch admit before agent batch (**TB-939**) | Run-scoped store does not replace pooled monthly orphan semantics | **TB-976** |
| Quick Scan reservation-id pattern exists for anonymous plane (**TB-894**) | Paying-tenant monthly ledger does not yet use per-call reservation ids | **TB-976** |

---

## 5. Pooled counter vs reservation-id (TB-894 contrast)

| Aspect | Paying tenant INV-004 (monthly/daily) | Anonymous Quick Scan (**TB-894** Done) |
|--------|--------------------------------------|----------------------------------------|
| Identity | One row per tenant + period key | Per-attempt `ReservationId` (`Guid`) |
| Store API | `ILlmTenantBudgetRepository.ReserveAsync` / `SettleAsync` | `IQuickScanGlobalBudgetReservationStore.TryReserveAsync` / `CommitAsync` / `ReleaseAsync` |
| Orphan handling | Pooled `ReservedAssumedUsd` until settle or manual fix | TTL + explicit `ReleaseAsync`; idempotency key on request |
| Crash between reserve and commit | Reserved pool sticks on shared row | Reservation row can expire/reclaim per TTL policy |
| Plane | Authenticated tenant LLM completions | Marketing Quick Scan only |

**Do not** cite **TB-894** as proof that paying-tenant monthly budgets already have per-reservation leases — it is the **target pattern** for **TB-976**.

---

## 6. Run-scoped batch reserve (**TB-939**)

`IRunScopedLlmBudgetReservationService.AdmitBeforeAgentBatchAsync` estimates batch USD/tokens and holds run-scoped reservation state **before** `IAgentExecutor.ExecuteAsync`, modeled on Quick Scan reserve/commit/release.

| Role | Behavior |
|------|----------|
| Pre-batch admit | Fail closed before first agent when headroom insufficient |
| Success / failure | Commit or release run-scoped hold |
| Relation to INV-004 | Complements per-call monthly reserve/settle; does not eliminate pooled monthly orphans |

---

## 7. Period key and clock (**TB-977** shipped for monthly)

| Monthly (TB-977) | Daily (residual) |
|------------------|------------------|
| Period key `yyyy-MM` from `GetSqlUtcMonthlyPeriodKeyAsync` / `SYSUTCDATETIME()` at monthly reserve | Daily key `yyyy-MM-dd` from `TimeProvider` in `LlmDailyTenantBudgetTracker` |
| Cross-period settle returns `PeriodKeyMismatch` with authoritative SQL period | Same boundary risk on UTC day until follow-on |
| `LastUpdatedUtc` uses SQL `SYSUTCDATETIME()` | — |

**TB-977** delivered: SQL period on monthly reserve/settle, cross-period settle rules, per-tenant in-flight admission gate, and tracker/repository metrics.

---

## 8. Failure-mode matrix

| Scenario | Cap breach? | User-visible effect | Until fixed |
|----------|-------------|---------------------|-------------|
| Two replicas reserve concurrently | No (CAS blocks overshoot) | Normal contention / retry | — |
| Crash after reserve, before settle | No | Later calls may see soft scarcity (`429` / quota) | **TB-976** reclaim |
| N parallel calls each reserve assumed-max | No | Later calls may hit in-flight admission block before reserve (**TB-977**) | — |
| Settle with lower actual than reserved | No | Excess reserved released on successful settle | — |
| Settle never runs (killed worker) | No | Sticky reserved USD/tokens | **TB-976** |
| Month-boundary skew (two period keys) | No on monthly path (**TB-977**) | Daily windows may still split | daily follow-on |
| Wallet overage path (**TB-014**) | No on included cap | Spend authorized from wallet ledger instead of monthly row | Wallet reconcile separate |

---

## 9. Dual-replica / chaos acceptance criteria

Use these as test and ops drill targets (implementation spread across **TB-976** / **TB-977**):

1. **Crash-between-reserve-and-settle:** Two-instance harness against one `LlmMonthlyTenantBudgetState` row — kill holder after `ReserveAsync`, verify **no hard-cap overspend** and document **orphan reserved** until reclaim ships.
2. **Concurrent cap hold:** Parallel reserves until hard cap — sum of `CommittedUsd + ReservedUsd` never exceeds `effectiveMax` under successful CAS paths.
3. **Month-boundary skew:** Monthly reserve uses SQL UTC period — parallel reserves across a synthetic month boundary cannot exceed one intended monthly hard cap (**TB-977** unit tests; full dual-replica integration optional).
4. **Optimistic retry exhaustion:** After `MaxOptimisticRetries` (12), reserve throws — ops alert via **TB-977** metrics (`llm.budget.monthly.optimistic_retry_exhausted`).

Existing dual-replica integration coverage for INV-004 baseline remains under Done **TB-011**; this contract names **lifecycle** gaps without reopening the harness as greenfield.

---

## 10. Mechanism map (code anchors)

| Mechanism | Location |
|-----------|----------|
| Monthly USD reserve/settle | `LlmMonthlyTenantDollarBudgetTracker` |
| Daily token reserve/settle | `LlmDailyTenantBudgetTracker` |
| Durable repository | `ILlmTenantBudgetRepository` / `SqlLlmTenantBudgetRepository` |
| State model | `LlmTenantBudgetStateReadModel` (`TotalUsdPressure`, `RowVersion`) |
| Run-scoped admit | `RunScopedLlmBudgetReservationService` (**TB-939**) |
| Quick Scan reservation-id | `IQuickScanGlobalBudgetReservationStore` / `DapperQuickScanGlobalBudgetReservationStore` (**TB-894**) |
| Accounting chokepoint | `LlmCompletionAccountingClient` (see **TB-1287**) |
| Schema | `dbo.LlmMonthlyTenantBudgetState`, `dbo.LlmDailyTenantTokenWindowState`; migration **155** (cap bump) |

---

## 11. PA review drill

1. Ask whether the buyer fears **cap bypass**, **orphan reserved**, or **soft denial under race** — three different answers.
2. Inspect `SpentUsd` / `ReservedAssumedUsd` (and token analogues) plus `ROWVERSION` behavior on the tenant period row.
3. Ask what happens if a replica dies between reserve and settle — answer must cite **TB-976**, not “automatic release.”
4. Ask how month-boundary time is chosen — monthly: SQL `SYSUTCDATETIME()` (**TB-977**); daily: app `TimeProvider` residual.
5. Contrast Quick Scan **TB-894** (reservation id) with monthly pooled counter — do not elide.
6. Treat “crash-proof settle,” “zero orphan reserved,” or “no race soft-DoS” as review findings.

---

## 12. Claim boundary (GTM **M-131** / **M-132**)

| Safe (buyer / GTM) | Too strong |
|--------------------|------------|
| Durable SQL + optimistic concurrency prevents multi-replica **hard-cap bypass** | Crash-proof settlement |
| Reserve-before-call / settle-after-call on the happy path | Exactly-once provider billing |
| Soft scarcity possible without cap breach | No race-induced denial pressure beyond in-flight admission gate (**TB-977**) |
| Quick Scan has reservation-id pattern; paying monthly uses pooled counter until **TB-976** | “Same lifecycle as Quick Scan” for paying tenants |

Canonical buyer handout: [`BUYER_SECURITY_PROCUREMENT_PACKET.md` § M-132](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-budget-reserve-settle-m-132). Engineering SoT: **this file**.

---

## 13. Follow-on controls (implement against this contract)

| ID | Must deliver |
|----|--------------|
| **TB-976** | Durable per-reservation id, expiry, orphan reclaim, paid-unsettle reconcile |
| ~~**TB-977**~~ | ~~SQL-owned UTC period membership; admission fairness; month-boundary + race tests~~ **Done** 2026-08-11 |
| ~~**TB-1287**~~ | ~~Mature cost plane + non-bypassable accounting~~ **Done** 2026-08-11 — [`LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md`](./LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md) |

---

## 14. Out of scope

- Replacing wallet overage semantics (**TB-014**).
- Provider refunds for in-flight completions.
- Authoring full FinOps / SDK-bypass matrix — **TB-1287** **Done** ([`LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md`](./LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md) / **M-226**); honesty CI is **TB-1288**.
- Reopening Done **TB-011** harness or **TB-894** Quick Scan implementation.
