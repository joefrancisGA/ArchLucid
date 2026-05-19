> **Scope:** Design spec for AI policy pack **AI-06 — Agentic AI & Tool-Use Governance (incl. MCP)**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for agentic AI posture — not safety certification of autonomous AI agents or guarantee of bounded agent behaviour.

# AI-06 — Agentic AI & Tool-Use Governance — design spec

---

## 1. Objective

Ship a pack covering the **architecture posture of agentic AI systems** — systems where LLMs autonomously invoke tools, call APIs, execute code, or orchestrate multi-step workflows with limited human intervention. The Model Context Protocol (MCP) has become the dominant tool-integration standard in 2026; this pack addresses MCP server inventory, tool authority bounds, sandbox isolation, human-in-loop gates, action audit trails, and blast-radius controls.

**Buyer outcome:** A buyer deploying an AI agent (Azure AI Foundry Agent Service, LangGraph, CrewAI, Semantic Kernel, or custom) can assign this pack and see which agentic architecture posture gaps exist — specifically around tool authority, escalation gates, audit trails, and containment.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | "Agentic AI" = LLM system that autonomously invokes external tools (API calls, code execution, file system access, database write) in a loop without requiring human approval for each step. | Working definition. |
| A2 | **MCP (Model Context Protocol)** by Anthropic is the primary tool-integration protocol in scope; rules also cover OpenAI function calling, Azure AI Foundry tool connections, Semantic Kernel plugins. | Protocol landscape 2026. |
| A3 | Architecture evidence: `services[]` for agent service; `relationships[].relationshipType = InvokesTool` for tool edges; `governance.RequiredControls` for authority bounds; `metadata.ChangeDescription` for tool-change rationale. | Manifest schema. |
| A4 | OWASP LLM08 (Excessive Agency) is the primary OWASP reference; this pack provides architectural depth beyond the single OWASP category. | Cross-reference to AI-01. |
| A5 | AI-19 (`multi-agent-orchestration`) covers supervisor/critic multi-agent topology. This pack covers single-agent tool-use posture. Where a rule applies equally to both, it lives here (single-agent) and AI-19 cross-references. | Adjacent pack boundary. |
| A6 | Human-in-loop gate patterns (approval workflows, confidence thresholds) are architecture posture; specific LLM confidence calibration is out of scope. | Scope boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `agent-` is distinct. | Verified. |
| C2 | Rules must not imply ArchLucid can determine whether an agent will behave safely at runtime. | Architecture-review scope only. |
| C3 | MCP server inventory rules overlap with `supply-chain-sbom` (#20) at the dependency surface; cross-reference, do not duplicate supply-chain lineage rules. | Adjacent pack boundary. |
| C4 | Azure AI Foundry agent service posture overlaps with `azure-openai-foundry` (AI-03) at the connection level; cross-reference, do not duplicate. | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
OWASP LLM08 + NIST AI 600-1 §GAI-6 + Anthropic MCP spec + Azure Foundry agent docs
        ↓
LLM generator (tool registry → authority → sandbox → gates → audit sub-corpora)
        ↓
Critic (tool-authority scope accuracy, blast-radius claim conservatism)
        ↓
Human SME
        ↓
agentic-ai-mcp-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `agentic-ai-mcp` |
| Display name | **Agentic AI & Tool-Use Governance** |
| Short name | `Agentic AI` |
| Category | **AI Governance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "OWASP LLM Top 10 v1.1 (LLM08 Excessive Agency); NIST AI 600-1 (2024) §GAI-6; Anthropic MCP Specification (2025)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `agent-registry-` | Tool / MCP server inventory (all tools enumerated, purpose documented, version pinned) | 5 | All P0 |
| `agent-auth-` | Tool authentication (each tool connection uses managed identity or credential-store reference, not hardcoded secrets) | 4 | P0-heavy |
| `agent-bounds-` | Authority bounds (least-privilege tool scope, read-before-write pattern, destructive-action prohibition without approval) | 6 | P0-heavy |
| `agent-sandbox-` | Sandbox isolation (code execution in isolated container, no access to host network, file-system scope) | 4 | P0/P1 |
| `agent-gate-` | Human-in-loop gates (approval workflow for high-impact actions, confidence threshold escalation, time-bound autonomy) | 5 | P0/P1 |
| `agent-audit-` | Action audit trail (each tool invocation logged with inputs/outputs, agent session correlation, immutable log) | 5 | P0/P1 |
| `agent-blast-` | Blast-radius containment (agent failure isolation, rollback capability, impact scope documentation) | 4 | P1 |
| **Total** | | **~33 rules** | |

### 5.3 Key evidence fields

`services[].Purpose` (agent service description), `services[].Tags` (tool authority level markers), `relationships[].relationshipType` (`InvokesTool` edges), `governance.RequiredControls` (authority bounds, approval gates), `governance.PolicyConstraints` (sandbox policy, autonomy time limits), `metadata.ChangeDescription` (tool addition justification), `metadata.DecisionTraceIds` (agent action audit correlation).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces tool registry and authority-bounds must-haves first — the highest-risk agentic posture gaps. Blast-radius rules (P1) surface as governance matures.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules implying agent safety guarantee | Every rule: architecture-posture framing ("does the manifest document authority bounds?"), not runtime safety claim. |
| MCP server credential leakage | `agent-auth-*` P0 rule: tool connections must use Key Vault references, not hardcoded secrets, documented in manifest. |
| Tool scope creep (OWASP LLM08) | `agent-bounds-*` requires each tool to have an explicitly bounded permission scope documented in `governance.RequiredControls`. |
| Adjacent pack confusion (AI-19 multi-agent) | Scope boundary documented in Assumptions; cross-reference in `frameworkMappings`. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Manifest count | Bump by 1; CI count test updated. |
| MCP spec evolution | MCP spec is versioned; rules reference capability categories (tools, resources, prompts) rather than specific spec version fields. |
| Adjacent packs | `owasp-llm-top10` (AI-01), `azure-openai-foundry` (AI-03), `rag-architecture` (AI-05), `multi-agent-orchestration` (AI-19). |

---

## 9. Acceptance criteria

1. ~33 rules; every sub-corpus represented.
2. All `agent-registry-*` rules require tool inventory in `services[]` or `metadata.ChangeDescription`.
3. No rule claims to evaluate runtime agent behaviour.
4. `metadata.frameworkMappingDisclaimer` contains "not safety certification of autonomous AI agents".
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack prevent my AI agent from taking harmful actions?**
A: No. ArchLucid evaluates architecture-level design decisions: whether tool authority bounds are documented, whether human-in-loop gates are designed into the architecture, and whether action audit trails are planned. Runtime agent behaviour is governed by your operational controls, not ArchLucid findings.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI01_OWASP_LLM_TOP10.md`](SPEC_AI01_OWASP_LLM_TOP10.md) | OWASP LLM08 Excessive Agency |
| [`SPEC_AI03_AZURE_OPENAI_FOUNDRY.md`](SPEC_AI03_AZURE_OPENAI_FOUNDRY.md) | Azure AI Foundry agent connections |
| [`SPEC_AI19_MULTI_AGENT.md`](SPEC_AI19_MULTI_AGENT.md) | Multi-agent orchestration topology |
