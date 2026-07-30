> **Reviewed:** 2026-07-28

> **Scope:** PA handout for paying-tenant LLM spend storm + billing dispute (GTM **M-295**). Contract: [`../library/PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md`](../library/PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md).

# Paying-tenant spend controls + metering reconciliation

**Audience:** FinOps, security (compromised key), principal architects.

**Claim:** Paying tenants use layered **HTTP / token / (optional) monthly estimated-USD / run-admit** fail-closed gates — not the Quick Scan anonymous plane. A **stolen API key burns remaining tenant headroom until revoke** (no per-key spend isolation). Product metering is **estimated** tokens/USD — **not** dispute-grade reconciliation to Azure Cost Management invoices.

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Metering reconciles to the Azure invoice” | Estimates + rollups for ops; invoice dispute needs Azure billing evidence |
| “Per-key spend isolation” | Key revoke stops next requests; headroom is tenant-scoped |
| “Anonymous Quick Scan gates protect paying tenants” | Different plane; paying path uses tenant gates (**TB-1570**) |

---

## Residuals

- Mature cost-control plane: **M-225** / **TB-1287**.
- INV-004 reserve/settle orphans: **M-131**/**M-132** / **TB-975**–**TB-977**.
- Distinct from TPM fairness: **M-296**/**M-297**.

**Related:** [`LLM_BUDGET_RESERVE_SETTLE_PA_ONE_PAGER.md`](LLM_BUDGET_RESERVE_SETTLE_PA_ONE_PAGER.md) · [`SHARED_AOAI_TPM_NOISY_NEIGHBOR_PA_ONE_PAGER.md`](SHARED_AOAI_TPM_NOISY_NEIGHBOR_PA_ONE_PAGER.md).
