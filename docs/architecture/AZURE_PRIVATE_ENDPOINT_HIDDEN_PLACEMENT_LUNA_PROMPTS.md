> **Scope:** Paste-ready GPT-5.6 Luna prompts. Collect private-endpoint subnet and target rows, then draw the hidden endpoint as a connector from the target service to the virtual network. The target stays in its resource group. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/extractor-private-endpoint-01-arg-placement.md`](../../.cursor/prompts/extractor-private-endpoint-01-arg-placement.md), [`.cursor/prompts/vnet-box-10-hidden-private-endpoint-connector.md`](../../.cursor/prompts/vnet-box-10-hidden-private-endpoint-connector.md)

# Hidden private-endpoint placement — Luna prompts

**Created:** 2026-09-28 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Script `0.4.1` writes `nicToSubnet` for a private-endpoint network interface. It does not write `peToSubnet`, `peToNic`, or `privateEndpointTarget`, because the inventory properties are empty and the Resource Graph relationship query never reads `microsoft.network/privateendpoints`. Full subscription hides that interface, so the subnet row has no owner. Copying the placement onto the Key Vault, storage account, or database as `in` would also put that service inside the virtual network box. The service stays in its resource group. The hidden endpoint still names the virtual network and marks the service Connected.

| ID | Prompt | Intent |
|----|--------|--------|
| **EX-PE-01** | [extractor-private-endpoint-01-arg-placement.md](../../.cursor/prompts/extractor-private-endpoint-01-arg-placement.md) | Query private endpoints. Write `peToSubnet`, `peToNic`, and `privateEndpointTarget`. Stamp script `0.4.2`. |
| **VN-10** | [vnet-box-10-hidden-private-endpoint-connector.md](../../.cursor/prompts/vnet-box-10-hidden-private-endpoint-connector.md) | A hidden private endpoint draws `private endpoint` from the target service to the virtual network. The service stays outside the box and is Connected. |

Run **EX-PE-01**, then **VN-10**. After EX-PE-01 is in the tree, run `scripts/azure/Get-SecureNowAzurePackage.ps1` again. Before upload, confirm `network-associations.json` contains `peToSubnet` and `privateEndpointTarget`, and `manifest.json` says `scriptVersion` `0.4.2`. VN-10 can be implemented against those association types before that zip exists.

## Do not pull into these sessions

- Filling `resources.json` with full ARM property bags
- A new association type
- Moving a Key Vault, storage account, or database into the virtual network because a private endpoint reaches it
- Showing private-endpoint cards by default
- The hosted collector (`hosted-1.0.0`)
- Re-running **EX-SP**, **VN-01–VN-09**, **NR**, **IDX**, or **AX-DE** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
