> **Scope:** Paste-ready GPT-5.6 Luna prompts. Draw each Azure virtual network as a bounding box inside the resource group that owns it. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/vnet-box-01-cited-membership.md`](../../.cursor/prompts/vnet-box-01-cited-membership.md), [`.cursor/prompts/vnet-box-02-pack-inside-resource-group.md`](../../.cursor/prompts/vnet-box-02-pack-inside-resource-group.md), [`.cursor/prompts/vnet-box-03-cross-group-and-edges.md`](../../.cursor/prompts/vnet-box-03-cross-group-and-edges.md), [`.cursor/prompts/vnet-box-04-png-cluster-parity.md`](../../.cursor/prompts/vnet-box-04-png-cluster-parity.md), [`.cursor/prompts/vnet-box-05-mode-ratchet.md`](../../.cursor/prompts/vnet-box-05-mode-ratchet.md), [`.cursor/prompts/vnet-box-06-frame-caption-icons.md`](../../.cursor/prompts/vnet-box-06-frame-caption-icons.md)

# Inventory diagram VNet boxes — Luna prompts

**Created:** 2026-09-24 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Resource-group frames already pack and paint. A VNet is still a card. `DiagramForestNestedFrameResolver` draws a rectangle after layout from edge labels `in` and `likely · in`. That misses VM-to-subnet hops, treats same-group collocation as containment, and can cover cards that are not in the VNet. Export PNG puts every VNet and subnet in one cluster labeled "VNet / subnet".

| ID | Prompt | Intent |
|----|--------|--------|
| **VN-01** | [vnet-box-01-cited-membership.md](../../.cursor/prompts/vnet-box-01-cited-membership.md) | Membership from cited placement only. Collocation does not join a box. |
| **VN-02** | [vnet-box-02-pack-inside-resource-group.md](../../.cursor/prompts/vnet-box-02-pack-inside-resource-group.md) | Pack each VNet inside its resource group and paint the box from those bounds. The VNet card becomes the caption. |
| **VN-03** | [vnet-box-03-cross-group-and-edges.md](../../.cursor/prompts/vnet-box-03-cross-group-and-edges.md) | Members in another resource group stay there. Drop `in` edges whose both ends sit inside the box. |
| **VN-04** | [vnet-box-04-png-cluster-parity.md](../../.cursor/prompts/vnet-box-04-png-cluster-parity.md) | One Graphviz cluster per VNet, labeled with the VNet name, members inside. |
| **VN-05** | [vnet-box-05-mode-ratchet.md](../../.cursor/prompts/vnet-box-05-mode-ratchet.md) | Identity, Data, Data flow, and neighborhood keep the mode rules. Tests only, plus a fix when a test fails. |
| **VN-06** | [vnet-box-06-frame-caption-icons.md](../../.cursor/prompts/vnet-box-06-frame-caption-icons.md) | Bold frame captions, a leading icon sized to the text, and no VNet card once the box exists. |

Run **VN-01**, then **VN-02**, then **VN-03**. **VN-04** after **VN-02**. **VN-05** after **VN-04**. **VN-06** last, after the box and the PNG cluster exist.

## Do not pull into these sessions

- Subnet boxes inside the VNet box
- A new icon pack or a download of Azure architecture SVGs
- Global `ComponentHorizontalGap` / `ComponentVerticalGap` or Mermaid `nodeSpacing` changes
- Graphviz `dot` as the live canvas
- NIC or private-endpoint cards
- Re-running **IDX**, **IDA**, **IDF**, **IDR**, **IE-ND**, or **AX-DE** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
