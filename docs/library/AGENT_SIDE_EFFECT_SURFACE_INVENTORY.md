> **Scope:** TB-952 — outbound capabilities reachable from agent handlers; pairs GTM **M-115** / **M-116**.

# Agent side-effect surface inventory

**Last updated:** 2026-08-14

## Objective

Give security reviewers a single inventory of what agent handlers can and cannot reach at runtime. This complements [`LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md`](LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md) (ingress) with an explicit **egress / side-effect** matrix and a CI architecture test guard.

## Handler assemblies (production)

| Handler | Assembly | Agent type key | Outbound on handler path |
|---------|----------|----------------|--------------------------|
| `TopologyAgentHandler` | `ArchLucid.AgentRuntime` | Topology | LLM completion (factory HTTP), retrieval read, grounding trace write |
| `CostAgentHandler` | `ArchLucid.AgentRuntime` | Cost | LLM completion, retail grounding lookups, grounding trace write |
| `ComplianceAgentHandler` | `ArchLucid.AgentRuntime` | Compliance | LLM completion, retrieval read, grounding trace write |
| `CriticAgentHandler` | `ArchLucid.AgentRuntime` | Critic | LLM completion only |
| `CostAgentHandler` (simulator) | `ArchLucid.Capabilities.Cost` | Cost (fake) | Deterministic in-process simulator only |

Executor: `RealAgentExecutor` resolves handlers by `AgentTypeKey`. There is **no model tool-loop** for HTTP, shell, ITSM, or ADO on the agent completion path.

## Allowed on agent handler path

- Azure OpenAI completion / batch transport via `IHttpClientFactory` (INV-010 — no raw `new HttpClient()`)
- Read-only retrieval (`IRetrievalQueryService`)
- Grounding trace persistence (`IRetrievalGroundingTraceWriter`) when retrieval is used
- Structured agent result persistence (findings, scores, traces) via host orchestration — not direct SQL from handlers

## Forbidden from handler assemblies (architecture test enforced)

- Raw `HttpClient` construction (reuse INV-010 scan scoped to handler assemblies)
- Outbound ITSM / Azure Boards vendor HTTP client types (`JiraOutboundIssueClient`, `ServiceNowOutboundIncidentClient`, `AzureBoardsOutboundIssueClient`)
- `System.Diagnostics.Process` / shell execution types
- Direct references to `ArchLucid.Application.Integrations.*.Outbound` client types on `*AgentHandler` constructors

## Host-only side effects (not agent-reachable)

| Capability | Entry | Notes |
|------------|-------|-------|
| ITSM ticket create | `ItsmOutboundIssueCreationService`, `IExternalTicketConnector` | Operator/API path only |
| Azure Boards / ADO | `AzureBoardsIntegrationService`, integration event handlers | Post-commit integration outbox |
| Webhooks / email | Notifications host | Not wired into agent handlers |
| Governance approve/waive | `GovernanceWorkflowService` | Human workflow outside model |
| MCP write tools | — | None shipped on agent loop |

## Human governance owns accept / waive

Even with allowlisted handlers and fail-closed `AllowedTools` (**TB-950**), hostile customer content can influence **model text**. Accept/waive, finalize, and export remain **human governance** paths — not model side effects.

## Adding a new agent capability

1. Extend this inventory table with the outbound surface and threat notes.
2. Update `AgentSideEffectSurfaceArchitectureTests` allowlist if a new handler assembly is introduced.
3. Cross-link GTM **M-115** / **M-116** if buyer-facing confinement copy changes.

## CI guard

`ArchLucid.Architecture.Tests/AgentSideEffectSurfaceArchitectureTests.cs` — fails CI when handler assemblies reference forbidden outbound types or construct raw `HttpClient`.
