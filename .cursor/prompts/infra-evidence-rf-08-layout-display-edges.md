# IE-RF-08 — Display-only derived layout edges (VM → VNet)

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-07**.

## Goal

Network and Executive inventory Mermaid may show a **derived** `VM -.-> VNet` (and optionally NIC omitted on executive) **without** recording that edge as ObservedFact. Evidence graphs keep `VM → NIC → subnet → VNet`.

## Why

Operators read “VM in VNet.” That chain is reconstructed from observed hops. Drawing only the chain is honest but noisy; drawing VM→VNet as ObservedFact would lie. The earlier ARM-export advice wanted this reconstruction — do it as **layout inference**.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- `DiagramAstLayoutEdgeBuilder.cs` (reuse; do not duplicate)
- `DiagramMode` (`Network`, `Executive`, `FullSubscription`)
- `GraphEdge.Weight` / `InferenceSource`
- `AzureInventorySnapshotGraphResolver.cs`

## What to build

1. After observed edges are on the `GraphSnapshot` (or at AST compile), add display edges only when **all** hops exist: VM `CONNECTS_TO` NIC, NIC `CONNECTS_TO` subnet, subnet parent/contains VNet (ARM parent id or `CONTAINS`).
2. New inference source e.g. `inventory-layout-vm-vnet`. Provenance DeterministicInference. Weight &lt; 1. Label something operators understand (`in` / `placed in`) — not `dependsOn`.
3. Modes: include derived edges in `DiagramMode.Network` and `Executive`. **Do not** add them to the security evidence path walker (SA-05 must still traverse NIC hops). If the compiler only sees the graph used by both, either:
   - keep derived edges off the snapshot relationship table and add them only in `DiagramAstLayoutEdgeBuilder`, **or**
   - stamp a property `layoutOnly=true` that SA-05 ignores.

   Prefer **AST-only** so path engines cannot traverse display shortcuts.

4. Tests:
   - Chain present → Network mermaid contains VM and VNet and a derived edge; snapshot relationship query does **not** include ObservedFact VM→VNet.
   - Missing NIC hop → no derived VM→VNet.
   - FullSubscription still readable (do not explode edge count: one derived edge per VM, not per NIC, using primary NIC if flagged else all NICs’ VNets de-duped).
5. Do not use ARM `dependsOn`.

## Acceptance criteria

- Path engines unchanged unless they consume DiagramAst (they must not).
- Honesty copy: if UI shows “in VNet”, Operate disclosure or edge title can say inferred from NIC/subnet.

## Constraints

- Compile: `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj`
- Tests: `FullyQualifiedName~DiagramAstFromGraphCompiler|FullyQualifiedName~DiagramAstLayoutEdge`

## Done when

A VM+NIC+subnet+VNet fixture Network compile shows VM linked to VNet in Mermaid while materializer tests still have no ObservedFact VM→VNet relationship.
