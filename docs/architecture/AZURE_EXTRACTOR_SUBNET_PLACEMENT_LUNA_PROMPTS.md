> **Scope:** Paste-ready GPT-5.6 Luna prompts. Make the customer Azure extractor write subnet placement into `network-associations.json`. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/extractor-subnet-placement-01-arg-objects.md`](../../.cursor/prompts/extractor-subnet-placement-01-arg-objects.md), [`.cursor/prompts/extractor-subnet-placement-02-arg-pagination.md`](../../.cursor/prompts/extractor-subnet-placement-02-arg-pagination.md)

# Azure extractor subnet placement — Luna prompts

**Created:** 2026-09-28 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

The customer script `0.4.0` lists virtual networks, network interfaces, and virtual machines with empty `properties` objects. A second Resource Graph query is supposed to write `nicToSubnet` and `vmToNic` into `network-associations.json`. On the 2026-09-26 `Hmd_HI_HAP_Non_Prod` package that query kept `nicToNsg` and `avdSessionHostToVm` only. The diagram then leaves each virtual network as a card.

| ID | Prompt | Intent |
|----|--------|--------|
| **EX-SP-01** | [extractor-subnet-placement-01-arg-objects.md](../../.cursor/prompts/extractor-subnet-placement-01-arg-objects.md) | Read Resource Graph arrays as objects. Write `nicToSubnet` and `vmToNic`. Stamp script `0.4.1`. |
| **EX-SP-02** | [extractor-subnet-placement-02-arg-pagination.md](../../.cursor/prompts/extractor-subnet-placement-02-arg-pagination.md) | Follow the inventory skip-token loop so page two is not dropped, and keep rows already collected when a later page fails. |

Run **EX-SP-01**, then **EX-SP-02**. After both are in the tree, run `scripts/azure/Get-SecureNowAzurePackage.ps1` again. Before upload, confirm `network-associations.json` contains `nicToSubnet` and `manifest.json` says `scriptVersion` `0.4.1`.

## Do not pull into these sessions

- Filling `resources.json` with full ARM property bags
- A new association type, or a change to the diagram renderer
- The hosted collector (`hosted-1.0.0`)
- Re-running **AX-DE**, **IE-RF**, **VN**, or **NR** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
