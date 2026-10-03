> **Scope:** Paste-ready GPT-5.6 Luna prompts. Recategorize intrinsic Azure nodes as relationships or parent properties, separate orphaned from unconnected, isolate Azure Virtual Desktop, and put every proven traffic hop on the data-flow diagram with NSG protocol and port annotations. NR-09 through NR-11 attach hidden NSGs to visible owners, surface imported effective controls as reachability, and label every visible resource Connected, Used, Orphaned, Unconnected, or Unknown. NR-12 shows why a resource is unknown and does not ask the reader to answer. NR-13 paints inbound NSG allow rules as protocol and port chips and removes the NSG card. NR-14 keeps all AVD-only assets and boundaries off the default general diagram unless Show AVD Assets is on; shared non-AVD infrastructure remains visible. NR-15 stops a connection to that shared infrastructure from putting an already identified AVD resource back on the plate. NR-16 paints a yellow questionable card from an assigned policy-pack finding and keeps the UHG unregistered-session-host predicate in that pack. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/node-relationship-01-connection-edges.md`](../../.cursor/prompts/node-relationship-01-connection-edges.md), [`.cursor/prompts/node-relationship-02-policy-edges.md`](../../.cursor/prompts/node-relationship-02-policy-edges.md), [`.cursor/prompts/node-relationship-03-parent-properties.md`](../../.cursor/prompts/node-relationship-03-parent-properties.md), [`.cursor/prompts/node-relationship-04-indirect-edges.md`](../../.cursor/prompts/node-relationship-04-indirect-edges.md), [`.cursor/prompts/node-relationship-05-orphaned-state.md`](../../.cursor/prompts/node-relationship-05-orphaned-state.md), [`.cursor/prompts/node-relationship-06-avd-isolation.md`](../../.cursor/prompts/node-relationship-06-avd-isolation.md), [`.cursor/prompts/node-relationship-07-dataflow-hops.md`](../../.cursor/prompts/node-relationship-07-dataflow-hops.md), [`.cursor/prompts/node-relationship-08-nsg-annotations.md`](../../.cursor/prompts/node-relationship-08-nsg-annotations.md), [`.cursor/prompts/node-relationship-09-hidden-nsg-attachment.md`](../../.cursor/prompts/node-relationship-09-hidden-nsg-attachment.md), [`.cursor/prompts/node-relationship-10-effective-control-reachability.md`](../../.cursor/prompts/node-relationship-10-effective-control-reachability.md), [`.cursor/prompts/node-relationship-11-connection-ledger.md`](../../.cursor/prompts/node-relationship-11-connection-ledger.md), [`.cursor/prompts/node-relationship-12-unknown-questions.md`](../../.cursor/prompts/node-relationship-12-unknown-questions.md), [`.cursor/prompts/node-relationship-13-nsg-port-chips.md`](../../.cursor/prompts/node-relationship-13-nsg-port-chips.md), [`.cursor/prompts/node-relationship-14-avd-off-the-plate.md`](../../.cursor/prompts/node-relationship-14-avd-off-the-plate.md), [`.cursor/prompts/node-relationship-15-identified-avd-stays-hidden.md`](../../.cursor/prompts/node-relationship-15-identified-avd-stays-hidden.md), [`.cursor/prompts/node-relationship-16-questionable-card.md`](../../.cursor/prompts/node-relationship-16-questionable-card.md)

# Inventory diagram node relationships — Luna prompts

**Created:** 2026-09-24 · **Revised:** 2026-10-01 (NR-16) · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Several Azure categories currently remain unconnected nodes. Some are relationships, some are properties of a parent, and some are valid resources whose links need cited evidence. Azure Virtual Desktop forms its own dense topology. Data flow must include every resource traffic traverses, while an NSG contributes its effective protocol and port to the connector.

| ID | Prompt | Intent |
|----|--------|--------|
| **NR-01** | [node-relationship-01-connection-edges.md](../../.cursor/prompts/node-relationship-01-connection-edges.md) | A connection or a resolvable workflow becomes a labeled relationship. |
| **NR-02** | [node-relationship-02-policy-edges.md](../../.cursor/prompts/node-relationship-02-policy-edges.md) | Route tables and NSGs project cited edges. They stop rendering as floating nodes. |
| **NR-03** | [node-relationship-03-parent-properties.md](../../.cursor/prompts/node-relationship-03-parent-properties.md) | Child and configuration resources attach to their proven parent. |
| **NR-04** | [node-relationship-04-indirect-edges.md](../../.cursor/prompts/node-relationship-04-indirect-edges.md) | Resolve indirect relationships and label evidence currency. |
| **NR-05** | [node-relationship-05-orphaned-state.md](../../.cursor/prompts/node-relationship-05-orphaned-state.md) | A missing required parent or endpoint is orphaned. Absence of optional links is unconnected. |
| **NR-06** | [node-relationship-06-avd-isolation.md](../../.cursor/prompts/node-relationship-06-avd-isolation.md) | AVD resources appear only in the AVD diagram unless they have a proven non-AVD role. |
| **NR-07** | [node-relationship-07-dataflow-hops.md](../../.cursor/prompts/node-relationship-07-dataflow-hops.md) | Every proven traversal hop appears on the data-flow diagram, in traversal order. |
| **NR-08** | [node-relationship-08-nsg-annotations.md](../../.cursor/prompts/node-relationship-08-nsg-annotations.md) | Annotate data-flow connectors with effective NSG protocol, port, and blocked state. |
| **NR-09** | [node-relationship-09-hidden-nsg-attachment.md](../../.cursor/prompts/node-relationship-09-hidden-nsg-attachment.md) | A peeled subnet or hidden NIC still removes the NSG card. The effective rule is on the visible owner's connector, including Full subscription. |
| **NR-10** | [node-relationship-10-effective-control-reachability.md](../../.cursor/prompts/node-relationship-10-effective-control-reachability.md) | Imported effective NSG and route rows reach the diagram as owner reachability, not observed traffic. |
| **NR-11** | [node-relationship-11-connection-ledger.md](../../.cursor/prompts/node-relationship-11-connection-ledger.md) | Every visible resource is Connected, Used, Orphaned, Unconnected, or Unknown. Each dropped import records why. |
| **NR-12** | [node-relationship-12-unknown-questions.md](../../.cursor/prompts/node-relationship-12-unknown-questions.md) | The outline states why each Unknown resource is unknown. The reader is not asked to answer. Empty state sections are hidden, and the five state names become readable sentences. |
| **NR-13** | [node-relationship-13-nsg-port-chips.md](../../.cursor/prompts/node-relationship-13-nsg-port-chips.md) | Full subscription and Network show inbound NSG allow rules as protocol and port chips on the owner. The NSG card is removed. An unattached NSG is a ledger row. |
| **NR-14** | [node-relationship-14-avd-off-the-plate.md](../../.cursor/prompts/node-relationship-14-avd-off-the-plate.md) | AVD-only resources and boundaries stay off the default general diagram unless Show AVD Assets is checked. Shared non-AVD infrastructure remains visible. |
| **NR-15** | [node-relationship-15-identified-avd-stays-hidden.md](../../.cursor/prompts/node-relationship-15-identified-avd-stays-hidden.md) | A resource already identified as AVD stays off the general diagram even when it connects to shared infrastructure. That infrastructure stays. **Show AVD Assets** is the only way to put the AVD resource back. |
| **NR-16** | [node-relationship-16-questionable-card.md](../../.cursor/prompts/node-relationship-16-questionable-card.md) | An assigned policy pack paints a questionable card yellow and a click shows the reason and the recommended action. The UHG rule for an `AVD` virtual machine that is not a collected session host is pack content, not a general diagram rule. |

Run **NR-01**, then **NR-02**, then **NR-03**, then **NR-04**, then **NR-05**. **NR-06** follows **NR-04**. **NR-07** follows **NR-04**. **NR-08** follows **NR-02** and **NR-07**. **NR-09** follows **NR-02** and **VN-07**. **NR-10** follows **NR-09**. **NR-11** follows **NR-05**, **NR-09**, and **NR-10**. Do not re-run NR-01 through NR-08 for that follow-on. **NR-12** follows **NR-11**. It does not build the VN-35 box and it does not ask the reader to answer. **NR-13** follows **NR-09** and does not change NR-08 data-flow annotations. **NR-14** follows the NR-06 filter already in the tree and does not add a checkbox. NR-12, NR-13, and NR-14 may run in any order after their dependencies. Do not re-run NR-01 through NR-11 for those follow-ons. **NR-15** follows **NR-14**. It removes the rule that a connection to shared infrastructure keeps an identified AVD resource on the plate. Do not re-run NR-01 through NR-14 for that follow-on. **NR-16** follows **NR-15**. It paints a yellow card from an assigned policy-pack finding and does not add a name-prefix AVD rule. Do not re-run NR-01 through NR-15 for that follow-on.

## Evidence labels

- **Current:** active Azure resource metadata or an ARM reference proves the relationship now.
- **Configured:** IaC declares it, without confirmation against the current deployment.
- **Observed:** logs or telemetry saw it, without proof that it remains current.
- **Derived:** a cited chain proves it indirectly, such as a VM reaching a subnet through its NIC.

Configured, observed, and historical evidence must keep that label. It cannot prove that a resource is orphaned.

## Do not pull into these sessions

- A new icon pack or a download of Azure architecture SVGs
- VNet packing, frame captions, or PNG cluster work from the VN prompt set
- Global diagram spacing changes
- Treating an NSG, network security perimeter, or diagnostic setting as a data-flow hop
- Showing AVD internals on the general inventory or data-flow diagram
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
- New Azure telemetry (NSG flow logs, firewall logs, load-balancer logs, metrics) from NR-09, NR-10, or NR-11
- Calling Unknown an orphan
