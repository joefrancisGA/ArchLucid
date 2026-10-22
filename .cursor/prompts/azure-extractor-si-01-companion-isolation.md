# EX-SI-01 — Do not blank every companion when one subnet property is missing

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement EX-COST-01 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Azure extractor. **Depends on:** current `master`. The package scripts already default `-IncludeCost` off. Do not change that default here.

## Goal

On a new Azure inventory package, a subnet that has no NAT gateway still produces `network-associations.json`, and a Data Factory that has pipelines still produces `adf-pipeline-flows.json`. One missing property records a warning for that companion. It does not replace the other companion files with `[]`.

## Why

Collection of subscription `Hmd_HI_HAP_Non_Prod` (`0966098b-4d6c-4f09-af1b-965bc2a2ad1d`) on 2026-10-06:

- Inventory succeeded with `resourceCount=893`.
- SecurityInventory then logged: `The property 'natGatewayId' cannot be found on this object. Verify that the property exists.`
- The step completed as Skipped.
- `adf-linked-services.json`, `adf-datasets.json`, `adf-pipeline-flows.json`, `adf-triggers.json`, and `role-assignments.json` were all `[]`.

`Get-SecureNowAzurePackage.ps1` and `Get-ArchLucidAzurePackage.ps1` wrap role assignments, network associations, diagnostics, Defender, and every ADF companion in one `try`. The `catch` writes each of those files as `[]` and the warning text says "Failed to collect role assignments or network associations" even when the throw is a later property read. A subnet without a NAT gateway is a normal ARM shape. That shape is not a reason to drop pipeline direction.

The literal `natGatewayId` is not in this repo. PowerShell strict mode throws that sentence when code serializes an Az.Network subnet, or reads a child id, on a subnet whose NAT gateway property is absent. `Add-ArchLucidSecurityInventoryResourceProperties` already catches `ConvertTo-Json` of `subnets` during inventory, which is why Inventory can succeed while SecurityInventory still throws. `Get-ArchLucidSubnetNetworkSecurityGroupId` then reads `$subnet.properties.networkSecurityGroup.id` outside the `ConvertFrom-Json` try. `Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord` reads `$peering.properties.remoteVirtualNetwork.id` outside a try. `Get-ArchLucidArgNestedProperty` is the safe reader. Use it.

## Read first

- `scripts/azure/Get-SecureNowAzurePackage.ps1` (SecurityInventory `try` / `catch`, about the warning "companion files will contain empty arrays")
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the same catch)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Add-ArchLucidSecurityInventoryResourceProperties`, `Get-ArchLucidAzureNetworkAssociationCompanionRows`, `Get-ArchLucidSubnetNetworkSecurityGroupId`)
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidArgNestedProperty`, `Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord`)
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`

## What to build

1. Branch `extractor/si-01-companion-isolation` from current `master`.
2. In both package scripts, collect and write each companion on its own. A throw in network associations leaves the ADF, role-assignment, diagnostic, Defender, policy-assignment, and other companion results that already succeeded. Write `[]` only for the companion that failed. The warning names that companion and the exception message. Do not use one warning that claims every file was emptied.
3. Read optional subnet children only when the property exists: `networkSecurityGroup`, `routeTable`, `natGateway`, and peering `remoteVirtualNetwork`. A missing child adds no row and does not throw. A present `natGateway.id` may add a `natGatewayToSubnet` row when that association type already exists. Do not invent a new association type if the catalog has no `natGatewayToSubnet` constant. Absence stays absence.
4. Serialize subnet and peering graphs to JSON without walking an Az.Network adapter property that throws under strict mode. If `ConvertTo-Json` throws on `natGatewayId`, copy the id fields the association code needs and continue.
5. Set `$scriptVersion` to `0.4.6` in both package scripts when it is still `0.4.5`. If it is already higher, leave it.
6. Tests:
    - A virtual network whose subnet JSON has `networkSecurityGroup.id` and no `natGateway` still emits `subnetToNsg` and does not throw.
    - `Get-ArchLucidSubnetNetworkSecurityGroupId` returns that NSG id for the same fixture.
    - A peering object with no `remoteVirtualNetwork` does not throw.
    - When the network-association helper throws, a package write still persists a non-empty ADF pipeline-flow result supplied by the ADF helper. Cover this in the package script that owns the catch, with the smallest test seam that already exists. If the package script has no test seam, add a helper that writes one companion file from a result object and test that helper: a failed association result does not replace a successful flow result with `[]`.

## Acceptance criteria

- A subnet with no NAT gateway does not fail SecurityInventory.
- `adf-pipeline-flows.json` is `[]` only when the pipeline-flow collector returned no rows or that collector itself failed.
- The manifest warning names the companion that failed.
- `scriptVersion` is `0.4.6` or already higher.
- SecureNow and ArchLucid package scripts follow the same rule.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change ADF dataset or pipeline-flow parsing. That collector is already on `master`.
- Do not turn cost collection on or off. That is EX-COST-01.
- Do not collect observed traffic.
- Working-tree safety. Stage only the two package scripts, the security-inventory and Resource Graph helpers, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
pwsh -NoProfile -Command "Invoke-Pester -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1' -Output Normal"
```

Heartbeat every 8 seconds on any command expected to run longer than 15 seconds.

## Done when

Tests pass. Tell the owner to run `scripts/azure/Run-SecureNowAzureExtractor.ps1` again from a tree that contains this change, then open the new ZIP. `manifest.json` must say `scriptVersion` `0.4.6` or higher. `adf-pipeline-flows.json` must contain `Read` or `Write` rows when the factories have static dataset activities, or a warning that names the pipeline-flow collector when that collector failed. A warning about a missing NAT gateway must not be the reason every companion is `[]`. Wait for that ZIP before any commit.
