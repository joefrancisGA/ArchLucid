> **Scope:** Design spec for AI policy pack **AI-19 — Multi-Agent System Orchestration**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for multi-agent system posture — not safety certification of autonomous multi-agent behaviour.

# AI-19 — Multi-Agent System Orchestration — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of **multi-agent AI systems** — systems where multiple AI agents collaborate via supervisor/orchestrator, critic, and worker agent topologies, using message buses, shared state stores, and inter-agent trust protocols. This is deeper than `agentic-ai-mcp` (AI-06, single-agent tool-use). The 2025–2026 explosion of agentic frameworks (Microsoft AutoGen, LangGraph, CrewAI, Google Gemini Agents) makes this a fast-growing architecture surface requiring specific governance posture.

**Buyer outcome:** An engineering team building a multi-agent system can assign this pack and see which orchestration architecture posture gaps exist — supervisor topology design, inter-agent trust, shared state security, agent loop termination, and attribution tracing.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Multi-agent system architectures include: **supervisor/orchestrator + workers**, **critic/verifier**, **peer-to-peer debate**, and **hierarchical** topologies. All are in scope. | Framework survey (AutoGen, LangGraph, CrewAI, Magentic-One). |
| A2 | Architecture evidence: each agent = a `services[]` entry; inter-agent edges = `relationships[].relationshipType = InvokesAgent`; shared state = a `datastores[]` entry; message bus = a `services[]` entry. | Manifest schema. |
| A3 | **Supervisor/orchestrator** = the controlling agent that routes tasks to worker agents and aggregates results. Supervisor authority scope and escalation design are key architecture concerns. | Multi-agent pattern. |
| A4 | **Inter-agent trust** = the mechanism by which agents authenticate each other's messages (signed messages, shared session token, identity-bound). | Security concern. |
| A5 | **Agent loop termination** = a mechanism to bound the number of steps/iterations an agent loop can execute before forced termination or human review. | Safety concern. |
| A6 | AI-06 (`agentic-ai-mcp`) covers single-agent tool-use posture. Multi-agent topology concerns (supervisor authority, inter-agent trust, shared state) are distinct. | Adjacent pack boundary. |
| A7 | AI-18 (`ai-red-team-safety`) covers red-team testing of agent behaviour. This pack covers **architectural design** of the multi-agent system. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `mas-` (multi-agent system) is distinct. | Verified. |
| C2 | Rules must not imply ArchLucid can evaluate multi-agent behaviour at runtime. | Scope boundary. |
| C3 | Inter-agent trust rules must address both synchronous (direct call) and asynchronous (message bus) communication patterns. | Coverage completeness. |
| C4 | Agent output attribution rules overlap with `ai-governance-responsible-ai` (#1) at the audit trail level; multi-agent rules add attribution chain complexity. | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
AutoGen + LangGraph + CrewAI + Magentic-One docs + Microsoft multi-agent architecture guidance
        ↓
LLM generator (topology → supervisor → inter-agent trust → shared state → loop control → attribution sub-corpora)
        ↓
Critic (topology-specific accuracy, agent role name consistency)
        ↓
Human SME
        ↓
multi-agent-orchestration-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `multi-agent-orchestration` |
| Display name | **Multi-Agent System Orchestration** |
| Short name | `Multi-Agent` |
| Category | **AI Governance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Microsoft AutoGen documentation; LangGraph documentation; CrewAI documentation; Microsoft Magentic-One (2024)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `mas-topo-` | Topology documentation (supervisor/worker/critic roles documented, agent dependency graph) | 4 | P0-heavy |
| `mas-super-` | Supervisor authority bounds (supervisor scope limit, escalation path, authority delegation design) | 5 | P0-heavy |
| `mas-trust-` | Inter-agent trust (message authentication, session binding, impersonation prevention) | 5 | P0-heavy |
| `mas-state-` | Shared state security (shared state store access control, state schema validation, state rollback capability) | 4 | P0/P1 |
| `mas-loop-` | Loop termination and circuit-breaker (max iteration bound, timeout, forced human escalation design) | 5 | P0-heavy |
| `mas-attr-` | Attribution tracing (per-agent action attribution, multi-agent audit trail, output provenance chain) | 4 | P0/P1 |
| **Total** | | **~27 rules** | |

### 5.3 Key evidence fields

`services[].ServiceName` (each agent in the system), `services[].Purpose` (supervisor, worker, critic, orchestrator roles), `relationships[].relationshipType` (`InvokesAgent` edges between agents), `datastores[].ServiceName` (shared state store), `governance.RequiredControls` (loop termination policy, supervisor authority bounds), `governance.PolicyConstraints` (inter-agent trust policy, impersonation prevention policy), `metadata.DecisionTraceIds` (multi-agent attribution chain).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces topology documentation, supervisor authority, inter-agent trust, and loop termination — the highest-risk multi-agent architecture gaps. Shared state and attribution rules surface at P0/P1.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Inter-agent impersonation (agent-A spoofs agent-B to gain elevated authority) | `mas-trust-*` P0 rule: inter-agent messages must include session-bound identity token or signed message with verifiable origin. |
| Runaway agent loops (unbounded cost and resource consumption) | `mas-loop-*` P0 rule: maximum iteration count and timeout must be explicitly documented and enforced in the architecture. |
| Shared state poisoning (worker agent corrupts supervisor's state) | `mas-state-*` P0 rule: shared state must have per-agent write-scope isolation; supervisor state is read-only for worker agents. |
| Attribution loss in long chains | `mas-attr-*` P1 rule: every agent action must be tagged with originating agent ID and session ID for chain reconstruction. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `agentic-ai-mcp` (AI-06), `ai-red-team-safety` (AI-18), `azure-openai-foundry` (AI-03). |
| Framework evolution | AutoGen, LangGraph, CrewAI are evolving rapidly; rules reference architectural capability (supervisor role, message bus, shared state) not framework-specific API. |
| Runaway cost risk | `mas-loop-*` rules pair with `llm-finops` (AI-17) kill-switch rules. |

---

## 9. Acceptance criteria

1. ~27 rules; every sub-corpus represented.
2. `mas-loop-*` includes ≥ 2 P0 rules for loop termination bounds.
3. `mas-trust-*` includes ≥ 2 P0 rules for inter-agent authentication.
4. No rule implies ArchLucid evaluates runtime agent behaviour.
5. `metadata.frameworkMappingDisclaimer` contains "not safety certification of autonomous multi-agent behaviour".
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack prevent my multi-agent system from running indefinitely or taking harmful actions?**
A: No. ArchLucid evaluates architecture-level design: whether loop termination bounds, inter-agent trust mechanisms, and supervisor authority limits are documented in your architecture. Preventing runaway behaviour requires implementation and operational controls — architecture documentation is a necessary but not sufficient condition.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI06_AGENTIC_AI.md`](SPEC_AI06_AGENTIC_AI.md) | Single-agent tool-use posture |
| [`SPEC_AI18_AI_RED_TEAM.md`](SPEC_AI18_AI_RED_TEAM.md) | Red-team programme complement |
| [`SPEC_AI17_LLM_FINOPS.md`](SPEC_AI17_LLM_FINOPS.md) | Loop cost control |
