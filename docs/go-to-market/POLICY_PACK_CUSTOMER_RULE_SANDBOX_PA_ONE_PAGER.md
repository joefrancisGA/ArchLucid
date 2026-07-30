> **Reviewed:** 2026-07-28

> **Scope:** PA handout for customer policy-pack rule sandbox / pin / blast-radius (GTM **M-299**). Contract: [`../library/POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md`](../library/POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md).

# Customer policy-pack rules — sandbox, pin, blast radius

**Audience:** Principal architects evaluating pack extensibility risk.

**Claim:** Customer rules are **declarative data** interpreted by a **bounded in-process** criteria engine — **not** a WASM/script sandbox. Versions **pin at commit** via pack assignment → effective governance + golden `RuleSetHash`. Blast radius is **tenant-/assignment-scoped** (self-degrade yes; cross-tenant data/RCE no; shared-process CPU residual).

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “WASM / script sandbox for customer rules” | Declarative in-process interpreter |
| “Packs are certifications” | Thematic mapping / advisory unless gate enforcing (**M-172**) |
| “A broken rule takes down all tenants” | Tenant-local assignment blast radius; shared CPU residual remains |

---

## Safe pin

> Customer-authored rules are data evaluated in-process under host bounds, pinned into the committed package, with blast radius limited to the assigning tenant. Do not sell WASM isolation or pack-as-certification.

**Related:** [`PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_PA_ONE_PAGER.md`](PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_PA_ONE_PAGER.md) · **M-235**/**M-236** (eval hybrid architecture).
