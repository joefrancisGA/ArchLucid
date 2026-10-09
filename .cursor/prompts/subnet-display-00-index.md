<!-- Inventory diagram subnet display — Luna prompts.
     Origin: 2026-10-03 owner ask. Peeled subnet cards were classified as
     missing, so Azure Bastions reported a subnet that no longer exists.
     SB-06 copies a firewall subnet id that the snapshot already stored.
     fw_hi_nprd_wvd still says the required subnet is missing, and the
     sentence names no subnet. SB-07 stores that id in the SecureNow
     package. The subnet exists in Azure.
     Do not implement from this index. -->

# Inventory diagram subnet display — Luna prompt set (SB-01–SB-07)

Paste **one** numbered file per GPT-5.6 Luna session, in order. Do not implement from this index.

Canonical doc: [`docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`](../../docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md).

| # | File | What moves |
|---|------|------------|
| 01 | `subnet-display-01-analysis-keeps-subnets.md` | A subnet that is in inventory stays available for analysis after its card is peeled. Bastions stop reporting that subnet as gone. |
| 02 | `subnet-display-02-show-subnets-checkbox.md` | Add **Show subnets**. Checked draws the subnet cards. Unchecked keeps them off the plate. |
| 03 | `subnet-display-03-network-defaults-subnets-on.md` | Choosing **Network — what can reach what** checks **Show subnets**. |
| 04 | `subnet-display-04-bastion-subnet-sentence.md` | A Bastion subnet named in this snapshot is not "no longer exists." |
| 05 | `subnet-display-05-bastion-subnet-capture.md` | The next capture stores the Bastion subnet id, and the diagram graph keeps it. |
| 06 | `subnet-display-06-firewall-subnet-on-graph.md` | Copy a firewall `ipConfigurations` subnet id that the snapshot already stored onto the diagram graph. |
| 07 | `subnet-display-07-firewall-subnet-capture.md` | The next SecureNow package stores the firewall's own subnet id and lists it on the parent virtual network. |

**01 → owner look → 02 → owner look → 03.** **04** follows **01** and can run before **02**. It does not add the checkbox. **05** follows **04**. It saves the Bastion subnet id the classifier never received. **06** follows **05**. It copies a firewall subnet id the snapshot already has. **07** follows **06**. The current ZIP never stored that id. Next session: **07**.

Each prompt stops before commit. The owner looks, then says whether to commit.

## What this set does not change

Do not delete subnet rows from inventory. Do not add a subnet bounding box. Do not change peel rank 20 for a render whose checkbox is off. Do not re-run **VN-07**, **EX-SP**, **NR**, or **SN-QQ** as greenfield.
