> **Scope:** Operator / finance runbook for raising a tenant’s **UTC-month LLM dollar hard cap** without waiting for the calendar roll. Complements **`LlmMonthlyTenantDollarBudget`** in app settings. **Stripe self-serve top-up (TB-014 remainder)** is future work — this document covers the **SQL bump** and in-memory test hook.

# LLM monthly budget purchased cap bump (TB-014)

## Behavior

- Base cap: **`LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth`**.
- **Effective hard cap** for a tenant and UTC month: `HardCutoffUsdPerUtcMonth + PurchasedCapBumpUsd` on row **`dbo.LlmMonthlyTenantBudgetState`** (migration **`155_LlmMonthlyTenantBudgetPurchasedCapBump.sql`**).
- **Warn** thresholds still derive from **`IncludedUsdPerUtcMonth`** and **`WarnFraction`** (not inflated by the bump) unless product changes later.

## SQL (emergency / manual top-up)

After a commercial agreement or internal approval, increment the bump for the active UTC month:

```sql
-- Example: add $50 to the May 2026 bump for one tenant (adjust ids / month).
UPDATE dbo.LlmMonthlyTenantBudgetState
SET PurchasedCapBumpUsd = PurchasedCapBumpUsd + 50.000000,
    LastUpdatedUtc = SYSUTCDATETIME()
WHERE TenantId = '00000000-0000-0000-0000-000000000000'
  AND UtcYear = 2026
  AND UtcMonth = 5;
```

Use **optimistic concurrency** in production tools if you extend this to an admin API (respect **RowVersion**).

## Code hooks

- **`InMemoryLlmTenantBudgetRepository.ApplyMonthlyPurchasedCapBumpAsync`** — tests and local dev parity with SQL bump semantics.
- **Stripe / Entitlement wiring** — document webhook → bump in a follow-on PR when commerce un-holds.

## Related

- **`docs/library/PER_TENANT_COST_MODEL.md`**
- **`docs/runbooks/GOLDEN_COHORT_BUDGET.md`**
- **`ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs`**
