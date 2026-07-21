> **Scope:** ADR 0061 — DDoS protection posture for V1 hosted pilots — full detail in sections below.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0061: DDoS protection posture for V1 hosted pilots

- **Status:** Accepted (owner ratified 2026-07-21; TB-908)
- **Date:** 2026-07-21
- **Deciders:** Owner / platform engineering
- **Related:** [ADR 0020](0020-azure-primary-platform-permanent.md), [ADR 0053](0053-enterprise-diagnostic-logging-observability-posture.md), **TB-903** (production Front Door WAF + private data plane), **TB-908**, `infra/terraform-edge/frontdoor.tf`, `docs/security/SYSTEM_THREAT_MODEL.md`
- **Amends:** *(none)*

## Context

Assessors and buyers ask whether ArchLucid has an explicit **denial-of-service** posture. Today:

- **Production-like stacks** route public HTTPS through **Azure Front Door Standard** with a WAF policy in **Prevention** mode (**TB-903**). Managed WAF rule sets are **not** used on Standard SKU (custom rules only).
- **Data-plane** resources (SQL, blob, Key Vault, Cosmos, Redis when enabled) are intended to be reachable via **private endpoints** (`infra/terraform-private`, per-root PE flags) with public network access disabled where Terraform applies.
- **No** `azurerm_network_ddos_protection_plan` exists in IaC.
- Application-layer abuse (LLM token exhaustion, webhook floods, heavy SQL) is partially covered in **`SYSTEM_THREAT_MODEL.md`** STRIDE rows but **volumetric / network DDoS** was undocumented.

Penetration-test SOWs and external UI checklists **exclude** denial-of-service by default; this ADR covers **platform posture**, not pen-test scope.

## Decision

**For V1 controlled pilots and early production:**

1. **Rely on Azure Front Door platform DDoS** at the public edge (Microsoft absorbs L3/L4 volumetric attacks against Front Door endpoints as part of the global edge; no separate DDoS plan purchase required for traffic terminated at Front Door).
2. **Do not deploy Azure DDoS Network Protection** in IaC for the current scale.
3. **Complement edge absorption** with:
   - **WAF Prevention** on Front Door (custom rules — rate limits / geo blocks are follow-on engineering, not managed rule sets).
   - **Private endpoints + deny public data-plane access** on SQL, storage, Key Vault, Cosmos, and Redis in production posture (**TB-903**).
   - **Application-layer limits** already in product (API rate limiting, LLM quotas/circuit breakers, outbox/DLQ patterns — see threat model).
4. **Do not claim** “Azure DDoS Protection Standard” or “DDoS Network Protection” in buyer-facing copy unless the corresponding Azure resource is deployed (not required at V1 per this ADR).

**Owner ratification:** Accepted 2026-07-21.

## Options considered

| Option | What it protects | Approx. cost (USD/mo, 2026 list) | Fit for ArchLucid V1 |
| --- | --- | --- | --- |
| **A — Front Door platform DDoS only** *(recommended)* | Traffic hitting Front Door endpoints / custom domains | Included in Front Door usage | **Yes** — matches TB-903 single public edge; minimal public IP count |
| **B — DDoS Network Protection** | Public IPs in linked VNets (CA env LB IPs, etc.) | **~$2,944/mo** fixed (up to 100 public IPs) + **~$29.50/IP** overage ([Azure pricing](https://azure.microsoft.com/en-us/pricing/details/ddos-protection/)) | **No** at pilot scale — cost dominates infra spend before revenue |
| **C — DDoS IP Protection (per public IP)** | Individual public IPs | **~$199/IP/mo** (per Microsoft pricing guide) | **No** for 1–2 IPs; only worth modeling if many bare public IPs without Front Door |
| **D — Front Door Premium + managed WAF** | Same edge + OWASP managed rules | Premium SKU uplift over Standard | **Deferred** — owner chose Standard + custom WAF (**TB-903**); not a DDoS substitute |

### What Network Protection would add (if adopted later)

- Adaptive tuning and **DDoS Rapid Response** for VNet-associated public IPs.
- **Cost protection** credits during documented attacks (Network Protection tier).
- Protection for resources **not** behind Front Door (e.g. direct Container Apps ingress FQDNs, standalone public IPs).

### What it would **not** replace

- App-layer abuse controls (LLM cost, auth brute force, webhook replay).
- WAF custom rules for HTTP floods that look like valid requests.
- Private networking choices — PEs reduce attack surface regardless of DDoS tier.

## Trade-offs

| Choice | Security | Scalability | Reliability | Cost |
| --- | --- | --- | --- | --- |
| **A (recommended)** | Good for edge volumetrics at pilot scale; residual risk on any **bypass** public origin FQDN | Front Door scales with Microsoft edge | FD health probes + secondary origin (**TB-903**) | **Low** — no DDoS plan line item |
| **B** | Strongest Azure-native volumetric story for VNet public IPs | Same | DRR + cost protection SLAs | **High** — ~$35k/year before compute |

**Constraints:** V1 pilots must not imply CPA-level or carrier-grade DDoS SLAs without contract and spend to match. Terraform remains the source of truth — no manual-only DDoS plan.

**Expected impact:** Assessors get a dated, costed answer. FinOps avoids a ~$3k/mo fixed fee until triggers fire.

## Revisit triggers (when to reopen this ADR)

Re-evaluate **Network Protection** or **IP Protection** when **any** of:

1. **Contractual:** A customer MSA or regulated sector requires named DDoS Protection Standard / Network Protection.
2. **Architecture:** Production traffic routinely hits **Container Apps (or other) public FQDNs** without Front Door in front (bypassing platform edge DDoS).
3. **Incident:** A volumetric attack causes sustained **Front Door origin unhealthy** or Azure support recommends DDoS plan enrollment with evidence.
4. **Scale:** More than **~15** tenant-scoped public IPs need protection **outside** Front Door (IP Protection vs Network Protection breakeven per [Microsoft pricing guide](https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-pricing-guide)).
5. **Revenue / risk:** Annualized infra spend or ARR crosses an owner-defined threshold where ~$3k/mo insurance is proportionate (suggested placeholder: **>$500k ARR** or **>$15k/mo** Azure run-rate — **owner to set**).

## Implementation notes (no IaC change in TB-908)

- **Production:** Keep `enable_front_door_waf = true` and custom domains CNAME to Front Door, not directly to Container Apps, when possible.
- **Staging drills:** TB-905 failover exercises secondary origins; document any temporary direct-origin access and close it after the drill.
- **Follow-on engineering (out of TB-908 scope):** Front Door **custom** rate-limit rules; subscription anomaly alerts (**TB-909**).

## Acceptance (TB-908)

- [x] Dated decision document with rationale and revisit triggers — **this ADR**
- [x] Threat model cross-reference — **`SYSTEM_THREAT_MODEL.md`** §8.1
- [x] Owner ratification — **Status → Accepted** (2026-07-21)
- [ ] Trust-center copy update — **only if Accepted** and wording approved (do not imply Network Protection today)
