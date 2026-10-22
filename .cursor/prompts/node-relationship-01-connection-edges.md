# NR-01 — Connections and workflows become relationships

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-02 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

## Goal

Recategorize a connection resource as a relationship between its two proven endpoints. Recategorize a workflow as relationships for each workflow action whose target resource resolves. Display those as labeled edges and remove the standalone node when its endpoints resolve.

## Why

`Microsoft.Network/connections` and an orchestration workflow are relationships, not architecture nodes. A connection without both endpoints, or a workflow action without a resolvable target, must remain visible as unresolved rather than disappearing.

## Categories

- **connections:** VPN, ExpressRoute, VNet peering, and service connections. The edge label names the connection type and both endpoints.
- **workflows:** a Logic App or orchestration flow. Each resolvable trigger or action becomes an edge to the resource it calls. A workflow with no resolvable external action remains a node.

## What to build

Find the inventory projection that creates diagram nodes and edges. Add one type that classifies these two categories.

A connection becomes one edge only when both endpoint ARM ids resolve to diagram nodes. Copy the connection's evidence label onto that edge. Remove the connection node after the edge is emitted.

A workflow remains a node until at least one action target resolves. Emit one edge per resolved action, labeled with the action name. Do not invent an endpoint from a display name.

## Evidence

ARM endpoint references are **Current**. An IaC-only connection is **Configured**. A log-only call is **Observed**. Keep the label on the edge.

## Tests

1. A connection with two resolved gateways emits one labeled edge and no connection node.
2. A connection missing either endpoint emits no edge and remains an unresolved relationship.
3. A workflow with two resolvable actions emits two edges.
4. A workflow with no resolvable action remains a node.
5. An IaC-only connection is labeled **Configured**.

## Acceptance criteria

- Both endpoints are proven before a connection node is removed.
- A workflow with no resolved action is not dropped.
- No endpoint is inferred from a name match.
- No route-table, NSG, parent-property, or data-flow work in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1` with the test project that contains the new tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can see a resolved connection as one labeled edge, and an unresolved connection is still present and explained.
