> **Scope:** Paste-ready GPT-5.6 Luna prompts. Keep peeled subnets in diagram analysis, and add a Show subnets checkbox that the Network diagram checks by default. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/subnet-display-01-analysis-keeps-subnets.md`](../../.cursor/prompts/subnet-display-01-analysis-keeps-subnets.md), [`.cursor/prompts/subnet-display-02-show-subnets-checkbox.md`](../../.cursor/prompts/subnet-display-02-show-subnets-checkbox.md), [`.cursor/prompts/subnet-display-03-network-defaults-subnets-on.md`](../../.cursor/prompts/subnet-display-03-network-defaults-subnets-on.md), [`.cursor/prompts/subnet-display-04-bastion-subnet-sentence.md`](../../.cursor/prompts/subnet-display-04-bastion-subnet-sentence.md), [`.cursor/prompts/subnet-display-05-bastion-subnet-capture.md`](../../.cursor/prompts/subnet-display-05-bastion-subnet-capture.md), [`.cursor/prompts/subnet-display-06-firewall-subnet-on-graph.md`](../../.cursor/prompts/subnet-display-06-firewall-subnet-on-graph.md), [`.cursor/prompts/subnet-display-07-firewall-subnet-capture.md`](../../.cursor/prompts/subnet-display-07-firewall-subnet-capture.md)

# Inventory diagram subnet display — Luna prompts

**Created:** 2026-10-03 · **Revised:** 2026-10-09 (SB-07) · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Peel rank 20 removes `Microsoft.Network/virtualNetworks/subnets` before orphan classification. A Bastion whose subnet is still in inventory is then captioned `Missing a required link: required subnet … no longer exists`. Hiding the card is not evidence that the subnet is gone. Analysis keeps the inventory subnet. Display grows a **Show subnets** checkbox, and choosing the Network diagram checks it.

| ID | Prompt | Intent |
|----|--------|--------|
| **SB-01** | [subnet-display-01-analysis-keeps-subnets.md](../../.cursor/prompts/subnet-display-01-analysis-keeps-subnets.md) | Resolve subnet existence on the pre-peel inventory graph. Stop the false Bastion report. |
| **SB-02** | [subnet-display-02-show-subnets-checkbox.md](../../.cursor/prompts/subnet-display-02-show-subnets-checkbox.md) | Add **Show subnets** on network-structure diagrams. Unchecked keeps the peeled plate. |
| **SB-03** | [subnet-display-03-network-defaults-subnets-on.md](../../.cursor/prompts/subnet-display-03-network-defaults-subnets-on.md) | Choosing **Network — what can reach what** checks **Show subnets**. |
| **SB-04** | [subnet-display-04-bastion-subnet-sentence.md](../../.cursor/prompts/subnet-display-04-bastion-subnet-sentence.md) | A subnet named by the Bastion and listed on its virtual network is not "no longer exists." |
| **SB-05** | [subnet-display-05-bastion-subnet-capture.md](../../.cursor/prompts/subnet-display-05-bastion-subnet-capture.md) | Fetch the full Bastion, store its subnet id, and copy that id onto the diagram graph. |
| **SB-06** | [subnet-display-06-firewall-subnet-on-graph.md](../../.cursor/prompts/subnet-display-06-firewall-subnet-on-graph.md) | Copy the firewall `ipConfigurations` subnet id onto the diagram graph so a subnet already listed on the virtual network clears the unnamed missing-subnet sentence. |
| **SB-07** | [subnet-display-07-firewall-subnet-capture.md](../../.cursor/prompts/subnet-display-07-firewall-subnet-capture.md) | Store the firewall's own IP-configuration subnet id on the SecureNow firewall resource, and list that id on the parent virtual network. Re-collect after this ships. |

Run **SB-01**, then **SB-02**, then **SB-03**. **SB-04** follows **SB-01** and can run before the checkbox. **SB-05** follows **SB-04**. **SB-06** follows **SB-05**. **SB-07** follows **SB-06**. Next session: **07**. Each prompt stops before commit.

The owner knows **SB-01** worked when the Bastion cards and the outline Problem column no longer say that an inventory subnet no longer exists. **SB-04** is the follow-on when a Bastion still says that after the owner has confirmed the subnet exists. **SB-05** is the follow-on when that sentence has no subnet name: the capture never stored the id. **SB-06** copies a firewall subnet id the snapshot already stored. **SB-07** is the follow-on for `fw_hi_nprd_wvd`: the sentence still names no subnet, and the SecureNow package never wrote `ipConfiguration.subnet.id[0]`. The subnet exists in Azure. **SB-03** is the default the Network dropdown applies. Clearing the checkbox hides the cards and must not bring the false report back. A snapshot taken before **SB-05** keeps the Bastion sentence until that subscription is captured again. **SB-06** clears the firewall sentence on the current snapshot only when that snapshot already has the firewall subnet id and the parent virtual network lists it. **SB-07** clears it on the next upload.

## Do not pull into these sessions

- A subnet bounding box inside the VNet box
- Changing peel rank 20 for renders that do not ask to show subnets
- Re-running **VN-07**, **EX-SP**, **NR**, or **SN-QQ** as greenfield
- Deleting subnet resources from the snapshot
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
