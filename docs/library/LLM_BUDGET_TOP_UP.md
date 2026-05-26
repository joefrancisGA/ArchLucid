> **Scope:** Contributor-reference — Operator / finance runbook for raising a tenant’s **UTC-month LLM dollar hard cap** and for the **self-serve non-expiring wallet** (TB-014). Complements **`LlmMonthlyTenantDollarBudget`** in app settings.

# LLM budget headroom — operator bump + self-serve wallet (TB-014)

## Two paths to more headroom

| Path | Who | When | Persistence |
|------|-----|------|-------------|
| **Operator SQL bump** | Internal / sales | Emergency, commercial agreement, or pre-wallet staging | **`PurchasedCapBumpUsd`** on the active UTC-month row — **does not roll over** |
| **Self-serve wallet** | Paying tenant (opt-in) | Tenant exhausts included monthly cap and has enabled auto-replenish | **`dbo.LlmTenantWalletState.BalanceUsd`** — **never expires** |

Both paths can coexist. The monthly budget row remains authoritative for **included** spend, warn thresholds, and hard-cutoff math. The wallet covers **overage** after the effective monthly cap is exhausted.

---

## Monthly budget (base + operator bump)

### Behavior

- Base cap: **`LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth`**.
- **Effective hard cap** for a tenant and UTC month: `HardCutoffUsdPerUtcMonth + PurchasedCapBumpUsd` on row **`dbo.LlmMonthlyTenantBudgetState`** (migration **`155_LlmMonthlyTenantBudgetPurchasedCapBump.sql`**).
- **Warn** thresholds still derive from **`IncludedUsdPerUtcMonth`** and **`WarnFraction`** (not inflated by the bump) unless product changes later.

### SQL (emergency / manual bump)

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

---

## Self-serve wallet (TB-014 — shipped)

**Decision (operator, 2026-05-25):** Non-expiring **prepaid auto-replenishing wallet**. Real-time card charge per refill (Stripe PaymentIntent). **No month-end settlement** — ArchLucid never carries more than one refill increment of unbilled exposure per tenant.

### Product rules

| Parameter | Value |
|-----------|-------|
| Refill increment | **$50** |
| Refill trigger | Balance **< $10** |
| Default at signup | **Overage off** (`MonthlyCapUsd = 0`, `AutoReplenishEnabled = false`) |
| Max auto-replenish cap | **$500 / UTC month** (beyond → sales conversation) |
| Balance expiry | **Never** — unused balance carries forward indefinitely |
| Card charge timing | **At each refill** (before consumption), not at UTC month end |
| Card failure | No credit; next LLM call returns **402** / existing quota-exceeded path; in-product banner to update payment method |
| Cancellation | Wallet balance is **non-refundable credit** — consumable only via ArchLucid LLM usage |

### Enforcement flow

1. **`LlmCompletionAccountingClient`** evaluates spend against the **effective monthly cap** (`HardCutoffUsdPerUtcMonth + PurchasedCapBumpUsd`).
2. If the call would exceed that cap:
   - Check **`LlmTenantWalletState.BalanceUsd`**.
   - If balance ≥ estimated cost → allow call; debit wallet post-call via **`LlmTenantWalletService.ConsumeAsync`**.
   - If balance insufficient → reject (existing **`LlmTokenQuotaExceeded`** / execution-gate path).
3. After each debit, if balance **< $10** and auto-replenish is enabled and the monthly cap allows another refill → **`TryAutoRefillAsync`** (Stripe PaymentIntent for **$50**).
4. Monthly cap enforcement: `(AutoRefillsThisUtcMonthCount × RefillIncrementUsd) < MonthlyCapUsd`; counter resets when UTC year/month changes.

### Persistence (shipped — migration **221**, `ArchLucid.sql` parity)

- **`dbo.LlmTenantWalletState`** — balance, auto-replenish settings, Stripe customer/payment-method refs, UTC-month refill counter.
- **`dbo.LlmTenantWalletLedger`** — append-only **`Refill` | `Consume` | `OperatorAdjustment`** entries with **`BalanceAfterUsd`** and optional **`StripePaymentIntentId`**.
- **`dbo.StripeWebhookIdempotency`** — replay-safe webhook handling.

**INV-004 note:** The wallet is **not** a second monthly budget ledger. **`dbo.LlmMonthlyTenantBudgetState`** remains the single source of truth for included/warn/hard-cutoff spend within the UTC month. The wallet holds **prepaid overage credit** only.

### API / UI (shipped)

- **`GET /v1/billing/wallet`** — balance, cap, auto-replenish state, last refill, Stripe publishable key.
- **`PUT /v1/billing/wallet`** — toggle auto-replenish, set **`MonthlyCapUsd`** in **$50** steps (**$0–$500**), attach Stripe customer/payment-method ids.
- **`POST /v1/billing/webhooks/stripe`** — idempotent **`payment_intent.succeeded`** / **`payment_intent.payment_failed`** (existing billing webhook route).
- **`archlucid-ui`** — **`/settings/billing`**: balance, cap slider, auto-replenish toggle; Stripe TEST customer/payment-method ids (Stripe Elements card form is a follow-on).

### Metrics (shipped)

- **`archlucid_llm_wallet_balance_usd`** (gauge, tagged **`tenant_id`**)
- **`archlucid_llm_wallet_refill_usd_total`** (counter)
- **`archlucid_llm_wallet_refill_failures_total`** (counter, tagged **`stripe_decline_code`**)

### Stripe / environment

- **Staging:** Stripe **TEST** keys (confirmed available 2026-05-25).
- **Production:** Live keys per [`docs/library/V1_DEFERRED.md`](V1_DEFERRED.md) §6b (commerce un-hold).
- **Azure Marketplace plan-add-on:** Deferred — wallet ships **Stripe-only** for V1 self-serve; Marketplace alignment is a follow-on when commerce un-holds.

---

## Code hooks

- **`InMemoryLlmTenantBudgetRepository.ApplyMonthlyPurchasedCapBumpAsync`** — tests and local dev parity with SQL bump semantics (operator path).
- **`ILlmTenantWalletRepository` / `LlmTenantWalletService`** — wallet balance, consume, auto-refill (self-serve path; TB-014).
- **`IStripeWalletGateway`** — Stripe.net PaymentIntent integration (**`Billing:Stripe:SecretKey`**, interface in **`ArchLucid.Core.Billing`**).

## Related

- **`docs/go-to-market/PRICING_PHILOSOPHY.md`** — hosted AOAI guard band + expansion levers
- **`docs/library/PER_TENANT_COST_MODEL.md`**
- **`docs/runbooks/GOLDEN_COHORT_BUDGET.md`**
- **`docs/library/TECH_BACKLOG.md`** — TB-014 full spec
- **`ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs`**
