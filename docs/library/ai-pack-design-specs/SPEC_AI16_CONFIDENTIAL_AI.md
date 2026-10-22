> **Scope:** Design spec for AI policy pack **AI-16 — AI Privacy & Confidential AI Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for confidential AI and AI privacy posture — not privacy certification, TEE security assurance, or regulatory compliance determination.

# AI-16 — AI Privacy & Confidential AI Architecture — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of **AI privacy and confidential computing for AI** — covering PII detection and redaction at the prompt boundary, no-train contractual posture, confidential VMs and Trusted Execution Environments (TEEs) for inference and training, customer data isolation in multi-tenant AI services, and data subject request (DSR) support for AI-generated logs. This is distinct from the general GDPR pack (#5): it focuses on **AI-specific** privacy architecture — the unique privacy risks introduced by LLMs, AI inference, and embedding pipelines.

**Buyer outcome:** A buyer deploying AI in a privacy-sensitive context (healthcare, financial services, public sector, regulated enterprise) can assign this pack and see which AI-privacy architecture gaps exist — particularly around prompt PII handling, confidential inference, and AI log retention.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: Confidential Computing Consortium (TEE specifications), Microsoft Confidential AI documentation (Azure Confidential VMs, Confidential Containers, Confidential Inferencing), NIST SP 800-188 (De-Identification), EU AI Act Article 10 (data minimisation for AI). | Multi-source. |
| A2 | **Confidential AI** = inference or training executed within a Trusted Execution Environment (TEE) so that the cloud provider and operator cannot access plaintext model weights, inputs, or outputs. | CCC definition. |
| A3 | **Prompt PII boundary** = the interface between user inputs and the LLM where PII/PHI must be detected, redacted, or annotated before the prompt reaches the model endpoint. | AI-specific privacy concern. |
| A4 | **No-train clause** = contractual representation (typically Azure OpenAI, Anthropic, etc.) that customer data will not be used for model training. Architecture evidence: service agreement reference documented in manifest. | Common enterprise requirement. |
| A5 | General GDPR data-residency, access control, and encryption rules are in `gdpr-baseline` (#5) and `security-architecture-baseline` (#2). This pack adds **AI-specific** privacy architecture — prompt PII, confidential compute, AI log DSR. | Non-duplication. |
| A6 | `azure-openai-foundry` (AI-03) covers Azure OpenAI private networking and CMK; this pack adds the confidential-computing and prompt-privacy layer. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `ai-priv-` is distinct. | Verified. |
| C2 | TEE security assurance (formal attestation reports) is out of scope — ArchLucid evaluates whether TEE is in the architecture, not whether the TEE implementation is secure. | Scope boundary. |
| C3 | No-train clause rules must reference contractual posture documentation in the manifest, not assume the clause exists. | Evidence limitation. |
| C4 | DSR handling for AI logs is phrased as architecture posture ("is a DSR pipeline for AI-generated logs documented?") not GDPR compliance determination. | Scope boundary. |

---

## 4. Architecture Overview

```
Confidential Computing Consortium + Microsoft Confidential AI docs + NIST SP 800-188 + EU AI Act Art. 10
        ↓
LLM generator (prompt PII → no-train → confidential compute → isolation → DSR sub-corpora)
        ↓
Critic (TEE product accuracy, CCC technical accuracy)
        ↓
Human SME
        ↓
ai-privacy-confidential-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-privacy-confidential` |
| Display name | **AI Privacy & Confidential AI Architecture** |
| Short name | `Confidential AI` |
| Category | **Security** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Confidential Computing Consortium; Microsoft Confidential AI documentation; NIST SP 800-188 (2023); EU AI Act Art. 10 (2024)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `ai-priv-prompt-` | Prompt PII boundary (PII detection at prompt ingestion, redaction pipeline, PII classification before LLM forwarding) | 5 | P0-heavy |
| `ai-priv-notrain-` | No-train contractual posture (service agreement no-train reference, consent posture, fine-tune opt-out) | 4 | P0/P1 |
| `ai-priv-tee-` | Confidential compute for AI (Confidential VM / container for inference, TEE attestation design, secure enclave for model weights) | 5 | P0/P1 |
| `ai-priv-iso-` | Customer data isolation in multi-tenant AI (per-customer encryption keys, prompt isolation, output isolation) | 5 | P0-heavy |
| `ai-priv-retain-` | AI log retention and DSR (AI-generated log retention policy, DSR pipeline for AI logs, AI interaction data minimisation) | 4 | P1 |
| `ai-priv-embed-` | Embedding privacy (PII in embeddings, embedding store access control, de-identification before embedding) | 4 | P1 |
| **Total** | | **~27 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (PII detection marker, TEE marker, no-train agreement reference), `services[].RuntimePlatform` (Confidential VM, Confidential Container), `governance.PolicyConstraints` (PII redaction policy, no-train posture, DSR policy for AI logs), `governance.ComplianceTags` (GDPR AI scope), `datastores[].Tags` (embedding store isolation, AI log retention policy), `datastores[].EncryptionAtRestRequired`.

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces prompt PII boundary and customer data isolation must-haves. TEE and DSR rules surface at P0/P1 and P1 respectively.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| TEE rules implying TEE security guarantee | Rules: "does the architecture document a TEE-based inference path?" not "is the TEE implementation secure?". |
| No-train rules used to imply regulatory compliance | Disclaimer: "Thematic architecture-review mapping; not privacy certification or regulatory compliance determination." |
| Prompt PII rules implying PII is detected with 100% recall | Rules: "is a PII detection pipeline documented and integrated?" not "all PII is detected". |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `gdpr-baseline` (#5), `azure-openai-foundry` (AI-03), `rag-architecture` (AI-05), `hipaa-architecture` (#11). |
| Confidential AI product evolution | Microsoft Confidential Inferencing is in preview as of 2025; rules reference capability category (confidential inference, TEE attestation) not specific product version. |

---

## 9. Acceptance criteria

1. ~27 rules; every sub-corpus represented.
2. `ai-priv-prompt-*` includes ≥ 2 P0 rules for PII detection at prompt boundary.
3. No TEE rule implies hardware security assurance.
4. `metadata.frameworkMappingDisclaimer` contains "not privacy certification".
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack ensure our AI system is GDPR-compliant?**
A: No. GDPR compliance determination requires legal analysis of data processing activities by qualified counsel. ArchLucid evaluates architecture-level posture — PII detection at the prompt boundary, no-train contractual posture, confidential compute design, and AI log retention governance.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI03_AZURE_OPENAI_FOUNDRY.md`](SPEC_AI03_AZURE_OPENAI_FOUNDRY.md) | Azure OpenAI private networking |
| [`SPEC_AI15_TRAINING_DATA.md`](SPEC_AI15_TRAINING_DATA.md) | Training data consent signals |
