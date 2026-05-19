> **Scope:** Design spec for AI policy pack **AI-05 — RAG Architecture Governance**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Thematic architecture-review mapping for Retrieval-Augmented Generation patterns — not certification of RAG output accuracy or grounding guarantee.

# AI-05 — RAG Architecture Governance — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of **Retrieval-Augmented Generation (RAG)** systems — the most widely deployed GenAI pattern in 2026. RAG introduces a distinct architecture surface (vector store, embedding pipeline, retrieval layer, grounding, citation chain) with specific security, reliability, and governance considerations absent from both pack #1 (RAI themes) and OWASP LLM Top 10 (attack vectors). Buyers deploying Azure AI Search + Azure OpenAI, LangChain, LlamaIndex, or equivalent stacks need architecture-evidence posture for this pattern.

**Buyer outcome:** An architect designing a RAG system can run ArchLucid and see, at the architecture level, which RAG-pattern posture gaps exist — covering knowledge-source access control, embedding model governance, retrieval authentication, grounding integrity, citation provenance, freshness policy, and content filter chain.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | RAG = embedding pipeline (documents → chunks → embeddings → vector store) + retrieval query (user query → embedding → ANN search → top-k chunks) + generation (chunks + system prompt → LLM → grounded response + citations). | Standard RAG pattern. |
| A2 | Authoritative sources: Microsoft RAG reference architecture (Azure AI Search + Azure OpenAI), OWASP LLM Top 10 v1.1 (LLM05 supply chain, LLM06 sensitive info disclosure, LLM09 overreliance), NIST AI 600-1 §GAI-9 (information security). | Multi-source. |
| A3 | Knowledge sources (documents, SharePoint, databases, APIs) are `datastores[]` in the manifest. Vector store is a datastore entry. Embedding service is a `services[]` entry. | Manifest schema mapping. |
| A4 | The pack addresses **architecture posture** — not retrieval accuracy, relevance ranking, or LLM output quality, which are operational and product concerns. | Scope boundary. |
| A5 | Hybrid RAG (vector + keyword search) is common; rules cover both retrieval modes where distinct posture exists. | Common deployment variant. |
| A6 | Agentic RAG (agents calling retrieval as a tool) overlaps with AI-06; cross-reference at the tool-call boundary, do not duplicate. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `rag-` is distinct from all existing prefixes. | Verified. |
| C2 | Rules must not assert "RAG responses are accurate" — that is a product quality claim ArchLucid cannot make. | Scope boundary. |
| C3 | Knowledge-source access control overlaps with `security-architecture-baseline` (#2) at the generic level; RAG rules must add RAG-specific context (chunked embedding access, retrieval auth, not just general datastore RBAC). | Non-duplication. |
| C4 | Personally-identifiable data in knowledge sources overlaps with `gdpr-baseline` (#5) and `hipaa-architecture` (#11); cross-reference, do not replicate. | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
RAG pattern reference (Azure AI Search + AOAI + LangChain)
+ OWASP LLM grounding guidance + NIST AI 600-1 §GAI-9
        ↓
LLM generator (knowledge-source → embedding → retrieval → generation sub-corpora)
        ↓
Critic (RAG-specific evidence-hint accuracy, grounding claim conservatism)
        ↓
Human SME
        ↓
rag-architecture-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `rag-architecture` |
| Display name | **RAG Architecture Governance** |
| Short name | `RAG` |
| Category | **AI Governance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Microsoft RAG reference architecture; OWASP LLM Top 10 v1.1; NIST AI 600-1 (2024)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `rag-src-` | Knowledge source governance (inventory, classification, access control, freshness policy) | 6 | P0-heavy |
| `rag-embed-` | Embedding pipeline (model governance, chunking strategy, PII in embeddings, embedding model versioning) | 5 | P0/P1 |
| `rag-vecstore-` | Vector store security (auth, encryption, private endpoint, index isolation per tenant) | 5 | P0-heavy |
| `rag-retrieval-` | Retrieval layer (auth context propagation, retrieval scope limits, result filtering) | 5 | P0/P1 |
| `rag-grounding-` | Grounding and citation (citation provenance, hallucination-reduction design, source attribution) | 5 | P1 |
| `rag-filter-` | Content filter chain (pre-retrieval query filter, post-retrieval context filter, post-generation filter) | 4 | P0/P1 |
| `rag-freshness-` | Knowledge freshness (re-indexing policy, stale-document TTL, change-event triggers) | 4 | P1/P2 |
| **Total** | | **~34 rules** | |

### 5.3 Key evidence fields

`datastores[].Tags` (knowledge source classification, freshness policy), `datastores[].PrivateEndpointRequired` (vector store isolation), `datastores[].EncryptionAtRestRequired` (embedding storage), `services[].Tags` (embedding model version, content filter markers), `services[].Purpose` (embedding service, retrieval service), `relationships[].relationshipType` (ReadsFrom knowledge source → embedding → vector store → retrieval → LLM chain), `governance.PolicyConstraints` (retrieval auth propagation policy, grounding policy).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces knowledge-source access control and vector-store security first — the highest-risk RAG architecture gaps. Grounding and freshness rules (P1/P2) surface as governance matures.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules implying grounding guarantees | Rules ask "does the manifest document the grounding and citation policy?" not "are responses grounded?". |
| PII exfiltration via RAG retrieval | `rag-src-*` rules require knowledge sources containing PII to be documented with access-control evidence. Cross-reference `gdpr-baseline`. |
| Multi-tenant vector store isolation | `rag-vecstore-*` includes a P0 rule requiring tenant-isolated indexes or namespace separation documentation. |
| Stale knowledge surface (OWASP LLM09 overreliance) | `rag-freshness-*` rules; cross-reference OWASP LLM Top 10 pack (AI-01). |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Manifest count | Bump by 1; CI count test updated. |
| Adjacent packs | `owasp-llm-top10` (AI-01), `agentic-ai-mcp` (AI-06), `azure-openai-foundry` (AI-03), `llm-observability-evals` (AI-10). |
| Pattern evolution | Multi-modal RAG (images, audio) is emerging; V1 covers text-document RAG. Flag in pack description for future extension. |

---

## 9. Acceptance criteria

1. ~34 rules; every sub-corpus represented.
2. No rule asserts retrieval accuracy or response quality.
3. All `rag-vecstore-*` P0 rules reference `datastores[].PrivateEndpointRequired` or `datastores[].EncryptionAtRestRequired`.
4. `metadata.frameworkMappingDisclaimer` contains "not certification of RAG output accuracy".
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack validate that my RAG system produces accurate, grounded responses?**
A: No. ArchLucid evaluates architecture-level posture: knowledge source access control, vector store isolation, retrieval authentication, and grounding policy documentation. Response accuracy and grounding quality are product and operational concerns evaluated via eval harnesses (see the LLM Observability pack).

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | AI pack index |
| [`SPEC_AI01_OWASP_LLM_TOP10.md`](SPEC_AI01_OWASP_LLM_TOP10.md) | OWASP LLM Top 10 (LLM09 overreliance) |
| [`SPEC_AI06_AGENTIC_AI.md`](SPEC_AI06_AGENTIC_AI.md) | Agentic RAG boundary |
| [`SPEC_AI10_LLM_OBSERVABILITY.md`](SPEC_AI10_LLM_OBSERVABILITY.md) | Eval harness complement |
