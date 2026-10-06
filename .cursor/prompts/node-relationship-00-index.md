<!-- Inventory diagram node relationships — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-24. Connections, policy, parent properties, indirect evidence,
     orphaned state, AVD isolation, data-flow hops, and NSG connector annotations.
     2026-09-27: hidden NSG attachment, effective-control reachability, connection ledger.
     2026-09-30: unknown questions (display only), NSG port chips, session hosts off the plate.
     2026-10-01: an identified AVD resource stays hidden despite shared-infrastructure edges.
     2026-10-01: a policy-pack finding paints a yellow questionable card and a click reason.
     Do not implement from this index. -->

# Inventory diagram node relationships — prompt set (NR-01–NR-31)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/node-relationship-*.md` file per session. NR-01 through NR-16 were written for GPT-5.6 Luna. NR-17 through NR-31 were written for Composer 2.5. Change the Model line in a file before pasting it to a different model.

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
| **Identified AVD stays hidden** | A matched session-host VM stays because it also connects to shared infrastructure. | Identification is enough. The VM, NIC, and disk stay off. The shared infrastructure stays on. | **NR-15** |
| **Questionable card** | A leftover resource looks the same as every other card. | An assigned policy pack paints that card yellow and a click states the reason and the action. The UHG unregistered-session-host rule is pack content. | **NR-16** |

## What this set does not change

Do not download icons or change VNet packing. Do not make an NSG, network security perimeter, or diagnostic setting a data-flow hop. Do not show AVD internals on the general diagram. Do not infer a relationship from resource-group collocation or a similar name. Do not collect flow logs, firewall logs, or metrics in NR-09, NR-10, or NR-11.

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04 → owner look → 05.**

**NR-06** and **NR-07** follow **NR-04**. **NR-08** follows **NR-02** and **NR-07**. **NR-09** follows **NR-02** and **VN-07**. **NR-10** follows **NR-09**. **NR-11** follows **NR-05**, **NR-09**, and **NR-10**. Do not re-run NR-01 through NR-08 for the follow-on. **NR-12** follows **NR-11**. **NR-13** follows **NR-09**. **NR-14** follows the NR-06 filter already in the tree. Do not re-run NR-01 through NR-11 for NR-12 through NR-14. **NR-15** follows **NR-14** and removes the shared-infrastructure exception. Do not re-run NR-01 through NR-14 for NR-15. **NR-16** follows **NR-15**. It paints a yellow card from an assigned policy-pack finding and does not add a name-prefix AVD rule. Do not re-run NR-01 through NR-15 for NR-16.

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
| 15 | `node-relationship-15-identified-avd-stays-hidden.md` | `nr/15-identified-avd-stays-hidden` |
| 16 | `node-relationship-16-questionable-card.md` | `nr/16-questionable-card` |
| 17 | `node-relationship-17-public-ip-attachment.md` | `nr/17-public-ip-attachment` |
| 18 | `node-relationship-18-no-resource-group-vnet-guess.md` | `nr/18-no-resource-group-vnet-guess` |
| 19 | `node-relationship-19-show-network-details.md` | `nr/19-show-network-details` |
| 20 | `node-relationship-20-visible-ends.md` | `nr/20-visible-ends` |
| 21 | `node-relationship-21-hidden-public-ip-mark.md` | `nr/21-hidden-public-ip-mark` |
| 22 | `node-relationship-22-ports-on-the-visible-line.md` | `nr/22-ports-on-the-visible-line` |
| 23 | `node-relationship-23-routed-through.md` | `nr/23-routed-through` |
| 24 | `node-relationship-24-private-access.md` | `nr/24-private-access` |
| 25 | `node-relationship-25-sends-traffic-to.md` | `nr/25-sends-traffic-to` |
| 26 | `node-relationship-26-connected-peering.md` | `nr/26-connected-peering` |
| 27 | `node-relationship-27-outside-this-subscription.md` | `nr/27-outside-this-subscription` |
| 28 | `node-relationship-28-has-access.md` | `nr/28-has-access` |
| 29 | `node-relationship-29-likely-lines.md` | `nr/29-likely-lines` |
| 30 | `node-relationship-30-plate-component-count.md` | `nr/30-plate-component-count` |
| 31 | `node-relationship-31-collect-stored-proof.md` | `nr/31-collect-stored-proof` |

## Stored connectivity (NR-17–NR-31)

Owner design, 2026-10-05. Edit a numbered file before pasting. Do not implement from this section.

**NR-17** is already written. Do not re-run it. **NR-18** is next.

| Step | What the plate does | Prompt |
|------|---------------------|--------|
| **Public IP parent** | An attached public IP is Connected or Used. An unattached public IP stays missing a required link. | **NR-17** |
| **No resource-group guess** | Sharing a resource group with one virtual network does not draw a line. | **NR-18** |
| **Show network details** | One checkbox on Full subscription shows public IPs, network security groups, route tables, and private endpoints. Network interfaces and subnets stay on the resource-group view only. | **NR-19** |
| **Visible ends** | A stored path through hidden resources draws one line between the visible ends. The checkbox draws the real cards instead, not both. | **NR-20** |
| **Public mark** | A virtual machine with a hidden public IP is marked **public**. | **NR-21** |
| **Ports** | Network security group protocol and port sit on that visible line. | **NR-22** |
| **Default route** | `0.0.0.0/0` to a visible firewall, network virtual appliance, or VPN gateway is **Routed through {name}**. Other routes are outline only. | **NR-23** |
| **Private access** | A hidden private endpoint draws **Private access** from the service to its virtual network. | **NR-24** |
| **Backends** | A load balancer or Application Gateway draws **Sends traffic to**, with the stored port. | **NR-25** |
| **Peering** | Connected peering is one **Peered** line. Any other state is outline only. | **NR-26** |
| **Outside** | A stored target missing from the snapshot is one shared **Outside this subscription: {name}** card. | **NR-27** |
| **Has access** | A role on one resource is a solid line. A resource-group or subscription role is outline only. | **NR-28** |
| **Likely** | Data Factory and Key Vault resource-group guesses are dashed **Likely** lines. They count. The outline says no stored link exists yet. | **NR-29** |
| **Count** | Connected components are the painted plate, dashed lines included. | **NR-30** |
| **Collect** | Reader collection stores linked services and single-resource role assignments. App settings are not read. | **NR-31** |

Run **18**, then **19**, then **20**. **21** follows **19**. **22** follows **20**. **23** follows **20**. **24** follows **19**. **25** and **26** follow **20**. **27** follows **24**, **25**, and **26**. **28** can follow **18**. **29** follows **18**. **30** follows **20** and **29**. **31** follows **28** and **29**, after a recollection is acceptable. Do not paste two of these in one session.
