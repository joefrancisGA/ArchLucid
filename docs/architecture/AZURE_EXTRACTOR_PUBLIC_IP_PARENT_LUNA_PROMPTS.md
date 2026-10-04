> **Scope:** Paste-ready GPT-5.6 Luna prompt. Read a public IP `ipConfiguration` in the customer package, write the existing `publicIpToNic` row, and copy `ipConfiguration.id` onto the diagram graph. Internal engineering only.
> **Paste-ready file:** [`.cursor/prompts/extractor-public-ip-01-ip-configuration.md`](../../.cursor/prompts/extractor-public-ip-01-ip-configuration.md)

# Public IP parent capture — Luna prompt

**Created:** 2026-10-04 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Script `0.4.3` writes `nicToSubnet` and `bastionToSubnet`. It does not read `microsoft.network/publicipaddresses`. On `Hmd_HI_HAP_Non_Prod`, a public IP in `tie0-mcnp-npra-ni` (DNS name `kubernetes`) is associated with a virtual machine in the portal, and the diagram still says `Missing a required link: no IP configuration or parent reference`. The NIC query only sees `Microsoft.Network/networkInterfaces`. An AKS node address points at `Microsoft.Compute/virtualMachineScaleSets/virtualMachines/networkInterfaces`. The inventory property bag is empty, and the diagram graph does not copy `ipConfiguration.id` even when a snapshot already stored it.

| ID | Prompt | Intent |
|----|--------|--------|
| **EX-PIP-01** | [extractor-public-ip-01-ip-configuration.md](../../.cursor/prompts/extractor-public-ip-01-ip-configuration.md) | Query public IP `ipConfiguration`. Write `publicIpToNic`, including a scale-set NIC parent. Stamp `ipConfiguration.id` and copy it onto the public IP graph node. Stamp script `0.4.4`. |

Run **EX-PIP-01** on its own. After it is in the tree, run `scripts/azure/Get-SecureNowAzurePackage.ps1` again. Before upload, confirm `network-associations.json` contains `publicIpToNic` for an attached public IP, `resources.json` has `ipConfiguration.id` on that public IP, and `manifest.json` says `scriptVersion` `0.4.4`. A zip collected with `0.4.3` keeps the sentence until it is collected again.

## Do not pull into this session

- Filling `resources.json` with full ARM property bags
- A new association type
- A change to `TryClassifyOrphanedPublicIp` wording
- Inventing a parent when `ipConfiguration` is absent
- Adding public IP addresses to the hosted type-list re-fetch
- **Show subnets** (SB-02, SB-03)
- Re-running **EX-SP**, **EX-PE**, **SB**, **VN**, or **SN-QQ** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
