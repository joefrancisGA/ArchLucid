> **Scope:** Design spec for AI policy pack **AI-08 — AI Gateway / LLM Reverse-Proxy Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for AI gateway posture — not certification of gateway performance or throughput guarantees.

# AI-08 — AI Gateway / LLM Reverse-Proxy Architecture — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of the **AI gateway layer** — the reverse-proxy / policy-enforcement layer that sits between consuming applications and LLM backends (Azure OpenAI, Anthropic, Mistral, etc.). Primary implementations: **Azure API Management (APIM) AI Gateway**, LiteLLM, Kong AI Gateway, Envoy AI Gateway. This layer enforces token limits, semantic caching, content safety policies, model routing, jailbreak detection, and multi-tenant isolation — distinct from the LLM backend (AI-03) and the application layer (AI-01, AI-05).

**Buyer outcome:** An enterprise deploying an AI gateway (whether APIM, LiteLLM, or custom) can assign this pack and see which gateway-layer architecture posture gaps exist across security, cost governance, and reliability.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: Microsoft APIM AI Gateway documentation, APIM AI policies documentation (token-limit, semantic-caching, llm-token-emission, azure-openai-token-limit), LiteLLM proxy docs, CNCF AI Gateway Working Group. | Multi-vendor. |
| A2 | The gateway layer is represented in the manifest as a `services[]` entry (e.g. `ServiceName: AI Gateway`, `RuntimePlatform: azure-api-management`) with `InvokesTool` or `CallsApi` edges to LLM backend services. | Manifest schema. |
| A3 | Semantic caching is an AI-gateway-specific capability (not an application-layer concern); rules cover cache key design, TTL governance, and cache bypass for sensitive queries. | Distinct scope. |
| A4 | Jailbreak detection at the gateway is an architecture-level policy decision; whether it is effective is an operational/red-team concern (AI-18). | Scope boundary. |
| A5 | This pack is **not** a repeat of APIM general governance (which would belong in an API management pack). Rules are specifically AI-gateway capabilities — token policies, model routing, AI-specific content filtering, semantic caching. | Distinct from general APIM. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `ai-gw-` is distinct. | Verified. |
| C2 | Token-budget rules overlap with `llm-finops` (AI-17); gateway-layer token policies (policy enforcement at proxy) are distinct from tenant-level token budget governance (architectural cost design). Rules cross-reference but do not duplicate. | Adjacent pack boundary. |
| C3 | Content-safety policy rules overlap with `azure-openai-foundry` (AI-03); gateway-layer policy (APIM policy applied at proxy) is distinct from Azure OpenAI service-level filter (configured in Azure Portal). | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
APIM AI Gateway docs + LiteLLM docs + CNCF AI GW WG
        ↓
LLM generator (token → routing → caching → safety → isolation sub-corpora)
        ↓
Critic (APIM policy name accuracy, evidence-hint field correctness)
        ↓
Human SME
        ↓
ai-gateway-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-gateway` |
| Display name | **AI Gateway / LLM Reverse-Proxy Architecture** |
| Short name | `AI Gateway` |
| Category | **Azure Platform** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Microsoft APIM AI Gateway documentation (2025); LiteLLM proxy documentation; CNCF AI Gateway Working Group" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `ai-gw-net-` | Gateway placement (private endpoint, no direct backend exposure from application) | 4 | All P0 |
| `ai-gw-auth-` | Gateway authentication (Entra ID / managed identity for backend, API key governance for consumers) | 4 | P0-heavy |
| `ai-gw-token-` | Token-limit policies (per-consumer token limits, rate limiting, burst protection) | 5 | P0/P1 |
| `ai-gw-route-` | Model routing (primary/fallback model routing, PTU vs PAYG routing, circuit-breaker) | 4 | P1 |
| `ai-gw-cache-` | Semantic caching (cache key design, TTL, bypass for PII queries, multi-tenant cache isolation) | 4 | P1 |
| `ai-gw-safety-` | Content safety at gateway (jailbreak detection policy, content filter at proxy, prompt inspection) | 4 | P0/P1 |
| `ai-gw-isolation-` | Multi-tenant isolation (per-tenant token budget, per-tenant backend credentials, request correlation) | 4 | P0-heavy |
| **Total** | | **~29 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (gateway product, token-limit policy enabled markers), `services[].RuntimePlatform` (APIM, LiteLLM, Kong), `relationships[].relationshipType` (`CallsApi` gateway → LLM backend), `governance.PolicyConstraints` (token limits, caching policy, jailbreak detection policy), `azureExtractor.manifest.SwitchesUsed` (APIM diagnostics, private endpoint switch).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces gateway networking, auth, token limits, and multi-tenant isolation. Semantic caching and model routing (P1) surface as the deployment matures.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Jailbreak detection rules implying runtime safety guarantee | Rules: "does the manifest document a jailbreak detection policy at the gateway?" not "does the gateway prevent jailbreaks?" |
| Cache poisoning in semantic cache | `ai-gw-cache-*` includes a P0 rule requiring cache key to exclude sensitive PII and requiring TTL governance. |
| Tenant isolation in shared gateway | `ai-gw-isolation-*` P0 rules require per-tenant credential isolation and budget separation. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `azure-openai-foundry` (AI-03), `llm-finops` (AI-17), `ai-red-team-safety` (AI-18). |
| APIM policy naming | APIM AI policy names evolve; rules reference capability (token limit) not specific policy name. |

---

## 9. Acceptance criteria

1. ~29 rules; every sub-corpus represented.
2. No rule implies gateway eliminates jailbreak risk.
3. `metadata.frameworkMappingDisclaimer` contains "not certification of gateway performance".
4. `ai-gw-isolation-*` includes ≥ 1 P0 rule for per-tenant isolation.
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack cover APIM general API management?**
A: No. This pack covers AI-gateway-specific capabilities: token-limit policies, semantic caching, model routing, jailbreak detection at the proxy layer, and multi-tenant isolation. General APIM governance (versioning, developer portal, product management) is out of scope.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI03_AZURE_OPENAI_FOUNDRY.md`](SPEC_AI03_AZURE_OPENAI_FOUNDRY.md) | LLM backend posture |
| [`SPEC_AI17_LLM_FINOPS.md`](SPEC_AI17_LLM_FINOPS.md) | Token budget governance (tenant level) |
