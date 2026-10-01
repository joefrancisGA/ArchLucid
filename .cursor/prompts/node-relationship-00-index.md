<!-- Inventory diagram node relationships — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-24. Connections, policy, parent properties, indirect evidence,
     orphaned state, AVD isolation, data-flow hops, and NSG connector annotations.
     2026-09-27: hidden NSG attachment, effective-control reachability, connection ledger.
     2026-09-30: unknown questions (display only), NSG port chips, session hosts off the plate.
     Do not implement from this index. -->

# Inventory diagram node relationships — Luna prompt set (NR-01–NR-14)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/node-relationship-*.md` file per GPT-5.6 Luna session.

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
| **Hidden NSG attachment** | A peeled subnet or hidden NIC leaves the NSG as a card. | The NSG card is removed and the effective rule is on the visible owner's connector. | **NR-09** |
| **Effective controls** | Imported effective NSG and route rows never reach the canvas. | Those rows become owner reachability. They are not observed traffic. | **NR-10** |
| **Connection ledger** | A lineless card is unlabeled, or the outline calls it unconnected. | Every visible resource is Connected, Used, Orphaned, Unconnected, or Unknown. | **NR-11** |
| **Unknown questions** | Unknown is a bare label, and empty states still render. | The outline states the question and does not ask for an answer. Zero-count sections are hidden. | **NR-12** |
| **NSG port chips** | An unresolved NSG is still a card, and a resolved NSG shows no ports. | Inbound allow rules are protocol and port chips on the owner. No NSG card. | **NR-13** |
| **AVD off the plate** | A session-host VM without a session-host edge still paints. | Those VMs, NICs, and disks stay off unless Show AVD Assets is on. No AVD boundary or count node remains by default. | **NR-14** |

## What this set does not change

Do not download icons or change VNet packing. Do not make an NSG, network security perimeter, or diagnostic setting a data-flow hop. Do not show AVD internals on the general diagram. Do not infer a relationship from resource-group collocation or a similar name. Do not collect flow logs, firewall logs, or metrics in NR-09, NR-10, or NR-11.

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04 → owner look → 05.**

**NR-06** and **NR-07** follow **NR-04**. **NR-08** follows **NR-02** and **NR-07**. **NR-09** follows **NR-02** and **VN-07**. **NR-10** follows **NR-09**. **NR-11** follows **NR-05**, **NR-09**, and **NR-10**. Do not re-run NR-01 through NR-08 for the follow-on. **NR-12** follows **NR-11**. **NR-13** follows **NR-09**. **NR-14** follows the NR-06 filter already in the tree. Do not re-run NR-01 through NR-11 for NR-12 through NR-14.

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
| 09 | `node-relationship-09-hidden-nsg-attachment.md` | `nr/09-hidden-nsg-attachment` |
| 10 | `node-relationship-10-effective-control-reachability.md` | `nr/10-effective-control-reachability` |
| 11 | `node-relationship-11-connection-ledger.md` | `nr/11-connection-ledger` |
| 12 | `node-relationship-12-unknown-questions.md` | `nr/12-unknown-questions` |
| 13 | `node-relationship-13-nsg-port-chips.md` | `nr/13-nsg-port-chips` |
| 14 | `node-relationship-14-avd-off-the-plate.md` | `nr/14-avd-off-the-plate` |
