# IDX-01 — Recapture nested relationship properties

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** existing extractor family on trunk (AX-DE shipped — do not re-run as greenfield). **Do not** implement hop compose, nested frames, PE UI, or IDX-02–13.

Do not implement from the wave index. Implement only *What to build*.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Persist the nested ARM relationship properties that already exist on type-scoped ARM GET / ARG payloads but are dropped before `AzureInventorySnapshot` graph-build: NIC IP-config subnet ids, private-endpoint subnet and target ids, Logic App `$connections.value`, App Service / Standard Logic App `kind`, ADF linked-service ARM ids, diagnostic settings workspace/storage/event-hub ids. Every `DiagramMode` then sees the same snapshot facts.

## Why

Owner Full subscription stayed at ~15 visible edges while 424 resources existed because hosted `/resources` list rows have empty nested `properties`. Hop-lift and maximize hydrators cannot invent a subnet id that was never stored. Recapture is the only way **all** diagram types improve together.

## Applies to every `DiagramMode`

Collection is **mode-agnostic**. Do not add a Full-subscription-only ZIP sibling.

| Mode | How this prompt helps |
|------|------------------------|
| Executive / Architecture / FullSubscription | VM→subnet, PE→target become composable |
| Network | nicToSubnet / peToSubnet / subnet NSG finally exist |
| Security | diagnostic + NSG associations survive |
| Identity | site `kind` / federated files unchanged; do not drop them |
| Data / DataArchitecture | storage diagnostic + PE target ids |
| DataFlow | ADF linked services + Logic App connections |
| ResourceGroup / SelectedResources / DependencyNeighborhood | same facts, smaller node sets |

## Context

- Hosted type-scoped lists (`GetOnlyHostedAzureArmReadClient`) and PowerShell ARG / ARM helpers
- `AzureInventoryLogicAppConnectionExtractor` / `HostedAzureInventoryLogicAppConnectionCollector`
- `network-associations.json` catalog (**IE-RF-01**) — extend rows, do not fork
- Completeness codes (**IE-RF-09**) — emit when VMs exist but `nicToSubnet` is still empty after this prompt

## What to build

1. On hosted NIC list/GET, copy **every** `ipConfigurations[].subnet.id` (not `[0]` only) onto stored properties or association rows (`nicToSubnet`). Null-check each config.

2. On hosted private-endpoint list/GET, persist subnet id and **all** `privateLinkServiceConnections` / `manualPrivateLinkServiceConnections` target ids.

3. Copy top-level ARM `kind` onto properties for `Microsoft.Web/sites` (Standard Logic Apps are `workflowapp`). Unwrap `parameters.$connections.value` for both Consumption `Microsoft.Logic/workflows` and Standard site workflow JSON when that companion is already collected.

4. Persist ADF linked-service `typeProperties` ARM ids / resource ids already returned by existing ADF companions (do not new Kudu or secret harvest).

5. Persist diagnostic settings destination ids (Log Analytics / storage / Event Hub) when the diagnostic companion is present.

6. Completeness: if inventory contains NICs and zero subnet ids after persist, add a stable code (reuse IE-RF-09 style). Same for PEs without targets, Logic Apps without connections file, ADF without linked services.

7. Tests (own files if new types):
   - NIC with two IP configs → two `nicToSubnet` rows.
   - PE with subnet + two targets → three associations.
   - Standard Logic App site `kind` containing `workflowapp` + `$connections.value` → connection ids stored.
   - Thin hosted `/resources` NIC with empty properties → completeness warning, no invented subnet.
   - Graph-build from the rich fixture yields those associations **before** any `DiagramMode` filter (assert by resolving the snapshot graph once, then compiling **all twelve** modes and checking each mode that still contains the VM/PE/Logic App still has a composable hop — modes that filtered the node away must not invent it).

## Acceptance criteria

- No second collector. No per-id GET for every subscription resource. Type-scoped lists + existing companions only.
- No secret values persisted from app settings (hosts / ARM ids only, same as AX-DE-18 / SN-RT rules).
- PE/NIC **cards** still absent from default compile.

## Constraints

- **Do not** implement IDX-02–13.
- **Do not** re-open AX-DE-01–18 as greenfield collection of new resource types.
- C# / Pester style per index. No `ConfigureAwait(false)` in tests.
- Verification: extractor tests + Core Logic App extractor tests named in the catalog prompt. Heartbeat if >15s.

## Done when

A fixture with nested NIC/PE/Logic App properties round-trips into snapshot associations, and compiling Executive, Network, FullSubscription, DataFlow, and DependencyNeighborhood from that **same** graph all see the hops (or honestly omit the node).
