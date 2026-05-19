> **Scope:** Design spec for AI policy pack **AI-03 — Azure OpenAI / AI Foundry Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Thematic architecture-review mapping for Azure OpenAI and AI Foundry posture — not Microsoft certification or Azure OpenAI Service Terms compliance validation.

> **Spine docs:** [`README.md`](README.md) · [`../POLICY_PACK_RULE_PRIORITY_MODEL.md`](../POLICY_PACK_RULE_PRIORITY_MODEL.md)

# AI-03 — Azure OpenAI / AI Foundry Architecture — design spec

---

## 1. Objective

Ship the definitive architecture-review pack for **Azure OpenAI Service** and **Azure AI Foundry** (formerly Azure AI Studio) — ArchLucid's primary LLM deployment surface. Buyers deploying GPT-4o, GPT-4.1, o3, or custom fine-tuned models on Azure need architecture-evidence posture for private networking, content filtering, CMK, abuse monitoring, throughput provisioning, Foundry agent topology, and regional data residency. This is the highest-density Azure AI posture pack and pairs directly with ArchLucid's extractor, which already captures Azure resource topology.

**Buyer outcome:** An Azure-native AI team can run ArchLucid against their architecture manifest and see specifically which Azure OpenAI / Foundry posture gaps exist across security, reliability, cost, and responsible-AI controls — with direct remediation guidance pointing to manifest fields and Azure extractor output.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: Microsoft Azure OpenAI Service documentation, Azure AI Foundry documentation, Microsoft Cloud Security Benchmark (MCSB) AI workload controls, Azure Well-Architected Framework AI workload guidance. | Official Microsoft docs. |
| A2 | **Azure OpenAI** = the managed API service (PTU, PAYG, fine-tune). **Azure AI Foundry** = the project/hub/agent orchestration layer (formerly AI Studio + Agent Service). Both are in scope. | Product line scope. |
| A3 | Private networking rules use `azureExtractor.manifest.SwitchesUsed` (private endpoint topology capture) and `datastores[].PrivateEndpointRequired`. | Extractor capability. |
| A4 | Content filtering (Azure OpenAI safety system) posture is documented in manifest narrative fields — ArchLucid cannot read filter configuration directly. | Evidence limitation. |
| A5 | Foundry agent topology (tools, connections, knowledge indexes) is captured via `services[]` and `relationships[]` in the manifest. | Manifest schema. |
| A6 | This pack is **Azure-specific**. AWS Bedrock / GCP Vertex AI are explicitly out of scope at V1. | Azure-native default. |
| A7 | Pack #1 (`ai-governance-responsible-ai`) covers model ownership, oversight, and RAI themes at generic level. This pack provides **Azure-platform-specific** depth — private endpoints, CMK, PTU, Foundry hub topology. | Non-overlapping. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `az-oai-` (Azure OpenAI) and `az-foundry-` (AI Foundry) to allow sub-corpus filtering. | Two prefix families in one pack. |
| C2 | Azure OpenAI content filter configuration cannot be validated by ArchLucid directly; rules are phrased as "does the manifest document content filter policy?" | Evidence limitation honesty. |
| C3 | Provisioned Throughput Unit (PTU) sizing decisions are operational; rules cover architecture-level documentation of PTU rationale, not capacity planning. | Scope boundary. |
| C4 | Fine-tuning data isolation rules overlap with `ai-training-data-provenance` (AI-15); cross-reference, do not duplicate. | Adjacent pack boundary. |
| C5 | No `Critical` severity at V1. | Common decision. |

---

## 4. Architecture Overview

```
Azure OpenAI Service docs + MCSB AI controls + WAF AI workload guidance
        ↓
LLM generator (az-oai-* and az-foundry-* sub-corpora)
        ↓
Critic (Azure resource field accuracy, extractor switch correctness)
        ↓
Human SME (PTU / content-filter posture calibration)
        ↓
azure-openai-foundry-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `azure-openai-foundry` |
| Display name | **Azure OpenAI & AI Foundry Architecture** |
| Short name | `Azure OpenAI` |
| Category | **Azure Platform** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Microsoft Azure OpenAI Service documentation + Azure AI Foundry documentation (2025–2026); MCSB AI workload controls" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `az-oai-net-` | Private networking (private endpoint, VNet integration, no public access for production) | 5 | All P0 |
| `az-oai-enc-` | Encryption (CMK via Key Vault, double encryption, BYOK for fine-tune storage) | 4 | P0-heavy |
| `az-oai-auth-` | Authentication (Entra ID / managed identity vs API key, key rotation) | 4 | P0-heavy |
| `az-oai-content-` | Content safety (content filter policy documented, abuse monitoring opt-in, jailbreak shield) | 5 | P0/P1 |
| `az-oai-ptu-` | Provisioned throughput (PTU deployment documented, PAYG fallback, capacity reservation) | 4 | P1 |
| `az-oai-residency-` | Regional data residency (EU boundary, US-only for government, model region pinning) | 4 | P0-heavy |
| `az-oai-ft-` | Fine-tuning isolation (fine-tune storage isolation, training data access control) | 3 | P0/P1 |
| `az-foundry-hub-` | AI Foundry hub/project topology (hub + project hierarchy, managed VNet, connections) | 5 | P0/P1 |
| `az-foundry-agent-` | AI Foundry agent service (tool registry, connection scope, agent identity) | 5 | P0/P1 |
| `az-foundry-mon-` | Monitoring (diagnostic settings, token usage metrics, latency alerting) | 4 | P1 |
| **Total** | | **~43 rules** | |

### 5.3 Key evidence fields

`azureExtractor.manifest.SwitchesUsed` (private endpoint topology), `azureExtractor.manifest.SubscriptionId` (region and subscription scope), `datastores[].PrivateEndpointRequired`, `services[].Tags` (content-filter policy markers, PTU deployment flags), `governance.PolicyConstraints` (content filter, abuse monitoring policy), `relationships[].relationshipType` (agent-to-tool edges, hub-to-project), `metadata.ChangeDescription` (model version and deployment justification).

---

## 6. Data Flow

Standard curated-rules pipeline. Extractor `SwitchesUsed` already captures private endpoint topology for Azure resources; rules instruct architects to ensure Azure OpenAI accounts are included in extractor scope. `priorityFloor: P0` surfaces networking, auth, and content-filter must-haves first.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules implying ArchLucid audits Azure OpenAI content filters directly | Rules are posture questions: "does the manifest document the content filter policy?" not "is the filter enabled?". |
| API key proliferation in manifests | Rules explicitly prohibit documenting raw API key values in manifest fields; recommend Key Vault reference only. |
| Fine-tune data isolation gap (adjacent to AI-15) | Fine-tune rules cross-reference `ai-training-data-provenance`; no data-lineage duplication. |
| Over-broad seeding for non-Azure tenants | `priorityFloor: P0` narrows to must-have rules; operators disable for AWS/GCP-primary deployments. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Manifest count | Bump by 1; CI count test updated. |
| Extractor integration | Confirm Azure OpenAI accounts appear in extractor topology when private-endpoint switch is enabled. |
| Adjacent packs | `security-architecture-baseline` (#2), `entra-iam-baseline` (#14), `agentic-ai-mcp` (AI-06), `ai-training-data-provenance` (AI-15). |
| Content filter evolution | Azure OpenAI content filter API evolves rapidly; rule descriptions should reference capability category (hate, violence, CSAM, jailbreak) rather than specific API version. |

---

## 9. Acceptance criteria

1. ~43 rules; every sub-corpus represented.
2. All `az-oai-net-*` rules reference `datastores[].PrivateEndpointRequired` or `azureExtractor.manifest.SwitchesUsed`.
3. `metadata.frameworkMappingDisclaimer` contains "not Microsoft certification".
4. No raw API key values referenced in remediation guidance.
5. No `Critical` severity.
6. CI count test passes.

---

## 10. Required FAQ wording

**Q: Does this pack validate my Azure OpenAI content filter configuration?**
A: No. ArchLucid evaluates whether your architecture manifest documents your content filter policy and abuse monitoring posture. It cannot read Azure OpenAI configuration directly. Use the Azure Portal or the Azure OpenAI management API to verify filter settings.

**Q: Does this pack cover AWS Bedrock or Google Vertex AI?**
A: No. This pack is Azure-specific. Non-Azure LLM platform governance is out of scope for V1.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | AI pack index |
| [`SPEC_AI06_AGENTIC_AI.md`](SPEC_AI06_AGENTIC_AI.md) | AI Foundry agent service depth |
| [`SPEC_AI15_TRAINING_DATA.md`](SPEC_AI15_TRAINING_DATA.md) | Fine-tune data governance |
| `docs/samples/policy-packs/azure-paas-security-rules-v1.json` | Adjacent Azure pack format reference |
