# EX-SI-02 — Accept the firewall subnet fact list on the Resource Graph association call

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement EX-COST-01 in this session. Do not change subnet display, the orphan classifier, or Data Flow routing.

**Repo:** `c:\ArchLucid`

**Wave:** Azure extractor. **Depends on:** current `master`, including EX-SI-01 and SB-07. `scriptVersion` is already `0.4.6`.

## Goal

`Run-SecureNowAzureExtractor.ps1` finishes SecurityInventory as Succeeded for subscription `Hmd_HI_HAP_Non_Prod`. The Resource Graph association call accepts the firewall and virtual-network subnet lists the package scripts already pass. Firewall subnet ids are stamped onto `resources.json` before the ZIP is written.

## Why

Collection of subscription `Hmd_HI_HAP_Non_Prod` (`0966098b-4d6c-4f09-af1b-965bc2a2ad1d`) on 2026-10-09:

- Inventory succeeded with `resourceCount=893`.
- PolicyDefinitions succeeded (`assignmentCount=60`, `definitionCount=3982`).
- SecurityInventory then logged: `A parameter cannot be found that matches parameter name 'FirewallSubnetFacts'.`
- The step completed as Skipped. PackageWrite still wrote `C:\ArchLucid\securenow-azure-package.zip` with `warningCount=1`.

That sentence is a PowerShell parameter-binding error. It is raised at the call, before `Search-AzGraph` runs. It is not an RBAC, tenant, or Resource Graph failure.

`Get-SecureNowAzurePackage.ps1` and `Get-ArchLucidAzurePackage.ps1` both call `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph` with `-FirewallSubnetFacts` and `-VirtualNetworkSubnetFacts`. The function body already reads both variables and passes them into `Add-ArchLucidArgNetworkAssociationRowsFromFirewallRecord` and `Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord`. Those two child functions already declare the matching parameters. The entry function's `param()` block does not. It declares only `SubscriptionId`, `ResourceGroupScope`, and `PublicIpIpConfigurationFacts`.

PowerShell reports the first unknown name and stops. Adding only `FirewallSubnetFacts` would make the next run fail on `VirtualNetworkSubnetFacts`. Both names belong on the entry function.

The same two names were also pasted onto `Add-ArchLucidArgNetworkAssociationRowsFromNicRecord`. That NIC function never reads them. A NIC record must not become the firewall's own subnet.

The throw sits in the outer SecurityInventory `try`, after the inner tries for role assignments and inventory-derived network associations. The Resource Graph call has no inner try. The outer `catch` then writes every companion that had not been assigned yet as `[]`, and it never reaches the second `Write-ArchLucidResourcesJsonStream`. The ZIP therefore keeps the first `resources.json` from Inventory, without the firewall subnet stamp, and it keeps empty ADF, diagnostic, Defender, policy-assignment, and the other later companion files. Do not treat this ZIP as a finished security inventory.

## Read first

- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph` `param()` block, `Add-ArchLucidArgNetworkAssociationRowsFromNicRecord`, `Add-ArchLucidArgNetworkAssociationRowsFromFirewallRecord`, `Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` (the Resource Graph call that passes `-FirewallSubnetFacts`, and the outer SecurityInventory `catch`)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the same call)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Add-ArchLucidFirewallSubnetPropertiesFromFacts`)
- `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`

## What to build

1. Branch `extractor/si-02-firewall-subnet-facts-parameter` from current `master`.
2. Add `[System.Collections.IList] $FirewallSubnetFacts = $null` and `[System.Collections.IList] $VirtualNetworkSubnetFacts = $null` to `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph`. Keep the existing null-to-empty-list assignments in the function body. Pass the caller's lists through, the same way `PublicIpIpConfigurationFacts` is already passed through. Do not allocate a new list when the caller passed one.
3. Remove `FirewallSubnetFacts` and `VirtualNetworkSubnetFacts` from `Add-ArchLucidArgNetworkAssociationRowsFromNicRecord`. Leave `PublicIpIpConfigurationFacts` there.
4. Set `$scriptVersion` to `0.4.7` in both package scripts. `0.4.6` is the build that skipped SecurityInventory on this parameter name.
5. Tests:
    - `(Get-Command Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph).Parameters` contains `FirewallSubnetFacts` and `VirtualNetworkSubnetFacts`.
    - `(Get-Command Add-ArchLucidArgNetworkAssociationRowsFromNicRecord).Parameters` does not contain either name.
    - The existing firewall ARG test also passes `-FirewallSubnetFacts`. That list gains one row whose `resourceId` is the firewall, `subnetId` is `AzureFirewallSubnet`, and `propertyName` is `ipConfiguration`. The private IP stays on the private-IP fact list only.
    - Do not call `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph` in a test. On a machine with `Az.ResourceGraph` it queries the signed-in subscription. Parameter metadata is the binding proof.

## Acceptance criteria

- A call that passes `-FirewallSubnetFacts` and `-VirtualNetworkSubnetFacts` binds.
- SecurityInventory is no longer Skipped for `A parameter cannot be found that matches parameter name 'FirewallSubnetFacts'`.
- A firewall IP-configuration subnet id is available to `Add-ArchLucidFirewallSubnetPropertiesFromFacts` through the list the package script created.
- A NIC association row does not write a firewall subnet fact.
- `scriptVersion` is `0.4.7`.
- SecureNow and ArchLucid package scripts keep the same call shape.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not query Azure from the tests.
- Do not change the stamp keys, the orphan classifier, or Data Flow **Routes through**.
- Do not turn cost collection on or off.
- No `ConfigureAwait(false)` in tests.
- Working-tree safety. Stage only the Resource Graph association helper, the two package scripts, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
```

Heartbeat every 8 seconds on any command expected to run longer than 15 seconds.

## Done when

Tests pass. Tell the owner the current `C:\ArchLucid\securenow-azure-package.zip` stays incomplete until they re-run `scripts/azure/Run-SecureNowAzureExtractor.ps1` from a tree that contains this change. The new run must show SecurityInventory Succeeded, and `manifest.json` must say `scriptVersion` `0.4.7`. `resources.json` must carry `ipConfiguration.subnet.id[0]` for `fw_hi_nprd_wvd` when Azure returned that firewall's `AzureFirewallSubnet`. Later companion files must not be `[]` merely because this parameter failed to bind. Wait for that ZIP before any commit.
