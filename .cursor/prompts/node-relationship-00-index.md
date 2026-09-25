<!-- Inventory diagram node relationships — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-24. Connections, policy, parent properties, indirect evidence,
     orphaned state, AVD isolation, data-flow hops, and NSG connector annotations.
     Do not implement from this index. -->

# Inventory diagram node relationships — Luna prompt set (NR-01–NR-08)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/node-relationship-0N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`](../../docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md).

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Connection edges** | Connections and workflows remain standalone nodes. | A resolved connection or workflow action becomes a labeled relationship. | **NR-01** |
| **Policy edges** | Route tables and NSGs float without their policy meaning. | Each proven route or NSG association becomes a relationship, preserving NSG rule data. | **NR-02** |
| **Parent properties** | Child configuration appears as an unconnected node. | A proven child attaches to its parent and leaves the standalone canvas. | **NR-03** |
| **Indirect edges** | Optional relationships are missing or unlabeled. | Cited indirect relationships carry Current, Configured, Observed, or Derived. | **NR-04** |
| **Orphan state** | Missing structure and optional isolation look the same. | A missing required parent is orphaned. A valid isolated resource is unconnected. | **NR-05** |
| **AVD isolation** | AVD internals appear among general architecture. | AVD internals appear only in the selected AVD diagram. | **NR-06** |
| **Data-flow hops** | Front Door, Application Gateway, and firewall can be absent from a flow. | Every proven traversal resource appears in traversal order. | **NR-07** |
| **NSG annotations** | NSG policy is separate from the flow. | The connector shows effective protocol, port, denial, and direction. | **NR-08** |

## What this set does not change

Do not download icons or change VNet packing. Do not make an NSG, network security perimeter, or diagnostic setting a data-flow hop. Do not show AVD internals on the general diagram. Do not infer a relationship from resource-group collocation or a similar name.

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04 → owner look → 05.**

**NR-06** and **NR-07** follow **NR-04**. **NR-08** follows **NR-02** and **NR-07**.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `node-relationship-01-connection-edges.md` | `nr/01-connection-edges` |
| 02 | `node-relationship-02-policy-edges.md` | `nr/02-policy-edges` |
| 03 | `node-relationship-03-parent-properties.md` | `nr/03-parent-properties` |
| 04 | `node-relationship-04-indirect-edges.md` | `nr/04-indirect-edges` |
| 05 | `node-relationship-05-orphaned-state.md` | `nr/05-orphaned-state` |
| 06 | `node-relationship-06-avd-isolation.md` | `nr/06-avd-isolation` |
| 07 | `node-relationship-07-dataflow-hops.md` | `nr/07-dataflow-hops` |
| 08 | `node-relationship-08-nsg-annotations.md` | `nr/08-nsg-annotations` |
