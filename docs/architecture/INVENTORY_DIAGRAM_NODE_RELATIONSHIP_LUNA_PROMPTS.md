> **Scope:** Paste-ready GPT-5.6 Luna prompts. Recategorize intrinsic Azure nodes as relationships or parent properties, separate orphaned from unconnected, isolate Azure Virtual Desktop, and put every proven traffic hop on the data-flow diagram with NSG protocol and port annotations. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/node-relationship-01-connection-edges.md`](../../.cursor/prompts/node-relationship-01-connection-edges.md), [`.cursor/prompts/node-relationship-02-policy-edges.md`](../../.cursor/prompts/node-relationship-02-policy-edges.md), [`.cursor/prompts/node-relationship-03-parent-properties.md`](../../.cursor/prompts/node-relationship-03-parent-properties.md), [`.cursor/prompts/node-relationship-04-indirect-edges.md`](../../.cursor/prompts/node-relationship-04-indirect-edges.md), [`.cursor/prompts/node-relationship-05-orphaned-state.md`](../../.cursor/prompts/node-relationship-05-orphaned-state.md), [`.cursor/prompts/node-relationship-06-avd-isolation.md`](../../.cursor/prompts/node-relationship-06-avd-isolation.md), [`.cursor/prompts/node-relationship-07-dataflow-hops.md`](../../.cursor/prompts/node-relationship-07-dataflow-hops.md), [`.cursor/prompts/node-relationship-08-nsg-annotations.md`](../../.cursor/prompts/node-relationship-08-nsg-annotations.md)

# Inventory diagram node relationships — Luna prompts

**Created:** 2026-09-24 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

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

Run **NR-01**, then **NR-02**, then **NR-03**, then **NR-04**, then **NR-05**. **NR-06** follows **NR-04**. **NR-07** follows **NR-04**. **NR-08** follows **NR-02** and **NR-07**.

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
