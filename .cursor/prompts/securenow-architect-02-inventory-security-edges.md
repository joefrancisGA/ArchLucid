# SA-02 — Live-inventory security edges

**Do not** emit findings or run path search. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

When materializing an `AzureInventorySnapshot`, write security-relevant relationships (RBAC, identity use, public exposure, private endpoint, NIC/subnet, diagnostics, policy) with honest `ProvenanceKind`. Heuristic edges must not look like ObservedFact.

## Why

IE-03 already materializes resources and some relationships. Privilege and reachability engines cannot run on `CONTAINS` / `PROTECTS` heuristics alone. Live inventory must project a **security evidence graph**, not a mega-graph of pods and findings.

## Context

- Plane §4
- `docs/architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md` IE-03
- `ArchLucid.KnowledgeGraph/WellKnownGraph.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- Snapshot relationship materialize in `ArchLucid.Persistence/InfraEvidence/`
- `docs/library/KNOWLEDGE_GRAPH.md`

## What to build

1. Extend `GraphEdgeTypes` / snapshot relationship types **only when** existing `CONTAINS`, `CONNECTS_TO`, `DEPENDS_ON`, `EXPOSES`, `PROTECTS`, `APPLIES_TO` do not fit. Prefer: `HAS_ROLE`, `USES_IDENTITY`, `CAN_READ`, `CAN_WRITE`, `ROUTES_TO`, `FEDERATES_AS` (no rows until SA-19).
2. ObservedFact: ARM parent/child, NIC→subnet, PE→resource, public IP association, diagnostic target, role assignment row as written by ARM (assignment exists — not “can administer production”).
3. DerivedFact: `CAN_READ` / `CAN_WRITE` from a documented RBAC data-plane map for **a small allowlisted set** of built-in roles (at least Reader, Contributor, Owner, Storage Blob Data Reader/Contributor, Key Vault Secrets User). Unknown roles → no derived edge + completeness warning, not a guessed action.
4. DeterministicInference: `ROUTES_TO` / `CONNECTS_TO` from explicit PE / subnet / NSG **allow** rules you can cite. Do not infer “all subnets in VNet can talk” without a cited rule or Azure default you document.
5. Every edge: `ProvenanceKind`, new `GraphEdgeInferenceSources` constants (e.g. `inventory-rbac-assignment`, `inventory-public-ip`, `inventory-private-endpoint`), `Weight` &lt; 1 for non-observed, evidence pointer to snapshot row.
6. Do **not** add pod nodes, finding nodes, or CMDB nodes.
7. Tests: role assignment → ObservedFact HAS_ROLE; derived CAN_READ is not ObservedFact; missing NSG does not create an allow-all ObservedFact; unknown ARM type still kept (IE-03 invariant); MaxNodes warning unchanged.

## Acceptance criteria

- Materialize is still one collector family (no new ARM client).
- Grep/architecture test: no new `management.azure.com` inventory client.

## Constraints

- Do not treat inferred edges as ObservedFact.
- Do not implement path search (SA-03).
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'`

## Done when

A fixture snapshot with MI + role assignment + public IP produces labeled edges an engine can traverse.
