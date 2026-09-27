> **Scope:** Paste-ready GPT-5.6 Luna prompts. Draw each Azure virtual network as a bounding box. VN-01 through VN-07 place that box inside the owning resource group. VN-08 and VN-09 make the VNet the primary box on Full subscription and Network diagrams, including members from other resource groups, and demote the resource-group frame. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/vnet-box-01-cited-membership.md`](../../.cursor/prompts/vnet-box-01-cited-membership.md), [`.cursor/prompts/vnet-box-02-pack-inside-resource-group.md`](../../.cursor/prompts/vnet-box-02-pack-inside-resource-group.md), [`.cursor/prompts/vnet-box-03-cross-group-and-edges.md`](../../.cursor/prompts/vnet-box-03-cross-group-and-edges.md), [`.cursor/prompts/vnet-box-04-png-cluster-parity.md`](../../.cursor/prompts/vnet-box-04-png-cluster-parity.md), [`.cursor/prompts/vnet-box-05-mode-ratchet.md`](../../.cursor/prompts/vnet-box-05-mode-ratchet.md), [`.cursor/prompts/vnet-box-06-frame-caption-icons.md`](../../.cursor/prompts/vnet-box-06-frame-caption-icons.md), [`.cursor/prompts/vnet-box-07-hidden-subnet-placement.md`](../../.cursor/prompts/vnet-box-07-hidden-subnet-placement.md), [`.cursor/prompts/vnet-box-08-vnet-primary-box.md`](../../.cursor/prompts/vnet-box-08-vnet-primary-box.md), [`.cursor/prompts/vnet-box-09-demote-resource-group-frames.md`](../../.cursor/prompts/vnet-box-09-demote-resource-group-frames.md)

# Inventory diagram VNet boxes — Luna prompts

**Created:** 2026-09-24 · **Revised:** 2026-09-27 (VN-08–VN-09) · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Resource-group frames already pack and paint. VN-01 through VN-06 build the VNet box from cited placement while subnet cards are on the canvas. VN-07 is the follow-on: peel rank 20 removes subnet nodes and their edges, the VNet stays a card, and the box must still form from the hidden subnet join. VN-08 and VN-09 follow the security-analyst reading: the VNet is the primary box on Full subscription and Network diagrams, including cross-group members, and the resource-group frame is the lighter container for cards that are not in a VNet.

| ID | Prompt | Intent |
|----|--------|--------|
| **VN-01** | [vnet-box-01-cited-membership.md](../../.cursor/prompts/vnet-box-01-cited-membership.md) | Membership from cited placement only. Collocation does not join a box. |
| **VN-02** | [vnet-box-02-pack-inside-resource-group.md](../../.cursor/prompts/vnet-box-02-pack-inside-resource-group.md) | Pack each VNet inside its resource group and paint the box from those bounds. The VNet card becomes the caption. |
| **VN-03** | [vnet-box-03-cross-group-and-edges.md](../../.cursor/prompts/vnet-box-03-cross-group-and-edges.md) | Members in another resource group stay there. Drop `in` edges whose both ends sit inside the box. |
| **VN-04** | [vnet-box-04-png-cluster-parity.md](../../.cursor/prompts/vnet-box-04-png-cluster-parity.md) | One Graphviz cluster per VNet, labeled with the VNet name, members inside. |
| **VN-05** | [vnet-box-05-mode-ratchet.md](../../.cursor/prompts/vnet-box-05-mode-ratchet.md) | Identity, Data, Data flow, and neighborhood keep the mode rules. Tests only, plus a fix when a test fails. |
| **VN-06** | [vnet-box-06-frame-caption-icons.md](../../.cursor/prompts/vnet-box-06-frame-caption-icons.md) | Bold frame captions, a leading icon sized to the text, and no VNet card once the box exists. |
| **VN-07** | [vnet-box-07-hidden-subnet-placement.md](../../.cursor/prompts/vnet-box-07-hidden-subnet-placement.md) | A hidden or peeled subnet still places same-group resources inside the parent VNet box. No subnet card. |
| **VN-08** | [vnet-box-08-vnet-primary-box.md](../../.cursor/prompts/vnet-box-08-vnet-primary-box.md) | On Full subscription and Network, the VNet box holds every cited member, including other resource groups. The resource group stays on the card. |
| **VN-09** | [vnet-box-09-demote-resource-group-frames.md](../../.cursor/prompts/vnet-box-09-demote-resource-group-frames.md) | The VNet stroke is the strong box. A resource-group frame remains only around cards that are not in a VNet, and its ink is lighter. |

Run **VN-01**, then **VN-02**, then **VN-03**. **VN-04** after **VN-02**. **VN-05** after **VN-04**. **VN-06** after the box and the PNG cluster exist. **VN-07** after **VN-01** and **VN-02** are in the tree. It does not redraw subnet cards. **VN-08** after **VN-03** and **VN-07**. **VN-09** after **VN-08**. Do not re-run VN-01 through VN-07 for that follow-on. VN-03's cross-group stay-put rule remains for every mode except Full subscription and Network.

## Do not pull into these sessions

- Subnet boxes inside the VNet box
- A new icon pack or a download of Azure architecture SVGs
- Global `ComponentHorizontalGap` / `ComponentVerticalGap` or Mermaid `nodeSpacing` changes
- Graphviz `dot` as the live canvas
- NIC or private-endpoint cards
- Re-running **IDX**, **IDA**, **IDF**, **IDR**, **IE-ND**, or **AX-DE** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
