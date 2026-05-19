> **Scope:** Design specs for the 20 candidate AI-oriented policy packs identified 2026-05-18. None of these packs are yet authored (rule JSON) or bundled — these documents are the **architecture / content-shape contract** that precedes rule authoring. Relationship to existing packs: the shipped pack #1 (`ai-governance-responsible-ai`) is the cross-cutting responsible-AI baseline; these 20 packs are distinct, deeper, or vertical specialisations.

> **Spine docs:** [`DEFAULT_POLICY_PACKS_V1.md`](../../go-to-market/DEFAULT_POLICY_PACKS_V1.md) · [`POLICY_PACK_CONTENT_BACKLOG.md`](../POLICY_PACK_CONTENT_BACKLOG.md) · [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../POLICY_PACK_RULE_PRIORITY_MODEL.md) · [`authoring-prompts/README.md`](../authoring-prompts/README.md)

# AI policy pack design specs — index

**Audience:** Product, GTM, engineering. Each spec follows the canonical 8-section format (Objective → Assumptions → Constraints → Architecture Overview → Component Breakdown → Data Flow → Security Model → Operational Considerations) plus Acceptance Criteria, FAQ wording, and Related Documents.

---

## Priority tier A — Highest procurement frequency (author first)

| # | Pack name | Slug | Spec file | Est. rules | Distinct from pack #1 |
|---|-----------|------|-----------|-----------|----------------------|
| AI-01 | OWASP Top 10 for LLM Applications | `owasp-llm-top10` | [SPEC_AI01_OWASP_LLM_TOP10.md](SPEC_AI01_OWASP_LLM_TOP10.md) | 25–35 | App-layer GenAI attack surfaces; pack #1 is cross-cutting RAI |
| AI-02 | ISO/IEC 42001 — AI Management System | `iso-42001-aims` | [SPEC_AI02_ISO_42001.md](SPEC_AI02_ISO_42001.md) | 40–50 | Certification-framework structure; pack #1 has no AIMS coverage |
| AI-03 | Azure OpenAI / AI Foundry Architecture | `azure-openai-foundry` | [SPEC_AI03_AZURE_OPENAI_FOUNDRY.md](SPEC_AI03_AZURE_OPENAI_FOUNDRY.md) | 35–45 | Platform-specific posture; pack #1 is platform-agnostic |
| AI-04 | EU AI Act — High-Risk AI (deep) | `eu-ai-act-high-risk` | [SPEC_AI04_EU_AI_ACT.md](SPEC_AI04_EU_AI_ACT.md) | 40–50 | Art. 6/9–15 depth; pack #1 has Annex III theme references only |
| AI-05 | RAG Architecture Governance | `rag-architecture` | [SPEC_AI05_RAG_ARCHITECTURE.md](SPEC_AI05_RAG_ARCHITECTURE.md) | 30–40 | Pattern-specific (retrieval, grounding, chunking); pack #1 is system-level |

## Priority tier B — Regulatory depth and modern AI stack

| # | Pack name | Slug | Spec file | Est. rules | Distinct from pack #1 |
|---|-----------|------|-----------|-----------|----------------------|
| AI-06 | Agentic AI & Tool-Use Governance | `agentic-ai-mcp` | [SPEC_AI06_AGENTIC_AI.md](SPEC_AI06_AGENTIC_AI.md) | 25–35 | Tool registry, MCP, blast-radius; pack #1 covers only high-level oversight |
| AI-07 | NIST AI 600-1 — Generative AI Profile | `nist-ai-600-1-genai` | [SPEC_AI07_NIST_AI_600_1.md](SPEC_AI07_NIST_AI_600_1.md) | 30–40 | GenAI-specific 12-risk profile; pack #1 covers RMF v1.0 cross-cutting |
| AI-08 | AI Gateway / LLM Reverse-Proxy Architecture | `ai-gateway` | [SPEC_AI08_AI_GATEWAY.md](SPEC_AI08_AI_GATEWAY.md) | 25–30 | Proxy/policy layer (APIM, Kong); no coverage in pack #1 |
| AI-09 | MLOps Platform Architecture | `mlops-platform` | [SPEC_AI09_MLOPS_PLATFORM.md](SPEC_AI09_MLOPS_PLATFORM.md) | 30–40 | Model registry, promotion gates, shadow patterns; pack #1 has 2 rules only |
| AI-10 | LLM Observability & Evaluation Architecture | `llm-observability-evals` | [SPEC_AI10_LLM_OBSERVABILITY.md](SPEC_AI10_LLM_OBSERVABILITY.md) | 25–30 | Eval harness, golden-set, OTel GenAI; no coverage in pack #1 |

## Priority tier C — Vertical specialists

| # | Pack name | Slug | Spec file | Est. rules | Distinct from pack #1 |
|---|-----------|------|-----------|-----------|----------------------|
| AI-11 | AI in Financial Services — Model Risk Management | `ai-financial-mrm` | [SPEC_AI11_AI_FINANCIAL_MRM.md](SPEC_AI11_AI_FINANCIAL_MRM.md) | 25–35 | SR 11-7 vertical; no vertical coverage in pack #1 |
| AI-12 | AI in Healthcare — FDA SaMD / GMLP / PCCP | `ai-healthcare-fda` | [SPEC_AI12_AI_HEALTHCARE_FDA.md](SPEC_AI12_AI_HEALTHCARE_FDA.md) | 25–35 | FDA-regulated AI devices; pack #1 is general-purpose |
| AI-13 | AI in US Public Sector — OMB M-24-10 | `ai-public-sector-us` | [SPEC_AI13_AI_PUBLIC_SECTOR.md](SPEC_AI13_AI_PUBLIC_SECTOR.md) | 25–35 | Federal AI inventory, rights-impacting; pack #1 is general-purpose |

## Priority tier D — Depth, defence, and niche

| # | Pack name | Slug | Spec file | Est. rules | Distinct from pack #1 |
|---|-----------|------|-----------|-----------|----------------------|
| AI-14 | MITRE ATLAS — Adversarial ML Threat Architecture | `mitre-atlas` | [SPEC_AI14_MITRE_ATLAS.md](SPEC_AI14_MITRE_ATLAS.md) | 20–30 | ML-attack surface mapping; no adversarial coverage in pack #1 |
| AI-15 | AI Training Data Governance & Provenance | `ai-training-data-provenance` | [SPEC_AI15_TRAINING_DATA.md](SPEC_AI15_TRAINING_DATA.md) | 25–30 | Dataset cards, C2PA, opt-out; pack #1 has 1 rule only |
| AI-16 | AI Privacy & Confidential AI Architecture | `ai-privacy-confidential` | [SPEC_AI16_CONFIDENTIAL_AI.md](SPEC_AI16_CONFIDENTIAL_AI.md) | 25–30 | TEE/confidential compute, PII at prompt; pack #1 has no TEE content |
| AI-17 | LLM Cost & Token Governance (FinOps for AI) | `llm-finops` | [SPEC_AI17_LLM_FINOPS.md](SPEC_AI17_LLM_FINOPS.md) | 20–25 | Token budgets, kill-switch; pairs with existing FinOps pack #7 |
| AI-18 | AI Red-Team & Safety Assurance Architecture | `ai-red-team-safety` | [SPEC_AI18_AI_RED_TEAM.md](SPEC_AI18_AI_RED_TEAM.md) | 20–30 | Red-team programme; pairs with ATLAS (#14), evals (#10) |
| AI-19 | Multi-Agent System Orchestration | `multi-agent-orchestration` | [SPEC_AI19_MULTI_AGENT.md](SPEC_AI19_MULTI_AGENT.md) | 20–30 | Supervisor/critic topology; deeper than #6's single-agent scope |
| AI-20 | US State AI Laws — Colorado AI Act + NYC LL 144 | `us-state-ai-laws` | [SPEC_AI20_US_STATE_AI_LAWS.md](SPEC_AI20_US_STATE_AI_LAWS.md) | 15–20 | State-level consumer-protection; no coverage in pack #1 |

---

## Authoring sequence (recommended)

Author **Tier A** first (AI-01 through AI-05) — they address the broadest set of active procurement asks. Add generator/critic context blocks to [`authoring-prompts/PACK_CONTEXTS.md`](../authoring-prompts/PACK_CONTEXTS.md) as each spec is approved.

Tiers B–D are depth-and-breadth investments; ship when buyer signal confirms demand.

---

## Common design decisions (apply to all 20 packs)

| Decision | Value |
|----------|-------|
| Pack type | `PlatformDefault` — seeded enabled-for-all; operators disable for irrelevant tenants |
| Default `priorityFloor` | `P0` — pilots see must-have rules first |
| Manifest position | Append to manifest; count tests must bump accordingly |
| No `Critical` severity at V1 | These are architecture-review packs, not deterministic gates |
| Disclaimer | Per-rule in `frameworkMappings` + pack `metadata.frameworkMappingDisclaimer` |
| Schema changes | None — content only, fits existing `CuratedRulesRuleEntry` + `PolicyPackContentDocument` |
| Authoring pipeline | LLM generator → critic → human SME (see [`authoring-prompts/README.md`](../authoring-prompts/README.md)) |
| Buyer-safe invariant | "Thematic architecture-review mapping; not [framework] certification." on every rule |
