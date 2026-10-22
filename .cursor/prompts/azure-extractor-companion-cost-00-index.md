<!-- Azure extractor — companion isolation and cost default.
     Origin: 2026-10-06. SecureNow collection of subscription
     Hmd_HI_HAP_Non_Prod (0966098b-4d6c-4f09-af1b-965bc2a2ad1d).
     Inventory succeeded with 893 resources. ActualCost ran for about
     three minutes, returned HTTP 429, and was skipped. SecurityInventory
     then threw "The property 'natGatewayId' cannot be found on this object"
     and wrote every companion file as []. adf-pipeline-flows.json was [].
     Do not implement from this index. -->

# Azure extractor — companion isolation and cost default

**Do not implement from this index.** Paste **one** numbered file per GPT-5.6 Luna session.

## Run order

1. **EX-SI-01.** A missing subnet property must not blank `adf-pipeline-flows.json` and the other companions.
2. **EX-COST-01.** The quick start must not query Cost Management or retail prices unless the user passes the matching flag.
3. **EX-SI-02.** The Resource Graph association call must accept `-FirewallSubnetFacts` and `-VirtualNetworkSubnetFacts`.

Re-collect only after **EX-SI-02** is in the script you run. `scriptVersion` `0.4.6` is the build that skipped SecurityInventory with `A parameter cannot be found that matches parameter name 'FirewallSubnetFacts'`.

| ID | File | Intent |
|----|------|--------|
| **EX-SI-01** | [azure-extractor-si-01-companion-isolation.md](azure-extractor-si-01-companion-isolation.md) | Keep each companion when another companion throws. A subnet with no NAT gateway does not fail the package. |
| **EX-COST-01** | [azure-extractor-cost-01-opt-in-cost.md](azure-extractor-cost-01-opt-in-cost.md) | Actual cost and retail prices stay off until `-IncludeCost` or `-IncludeRetailPrices`. |
| **EX-SI-02** | [azure-extractor-si-02-firewall-subnet-facts-parameter.md](azure-extractor-si-02-firewall-subnet-facts-parameter.md) | Declare the firewall and virtual-network subnet fact parameters on the Resource Graph association entry function. |
