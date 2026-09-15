#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1' {

    BeforeAll {
        [string]$scriptDir = Split-Path -Parent $PSScriptRoot
        . (Join-Path $scriptDir 'ArchLucid.SecurityInventory.helpers.ps1')
        . (Join-Path $scriptDir 'ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1')
    }

    It 'projects type on each ARG relationship query' {
        $specs = @(Get-ArchLucidArgNetworkAssociationQuerySpecs)

        $specs.Count | Should -Be 3
        foreach ($spec in $specs)
        {
            $spec.Query | Should -Match 'project id, type'
        }

        ($specs | Where-Object { $_.Kind -eq 'virtualNetwork' }).Query |
            Should -Match 'peerings = properties.virtualNetworkPeerings'
    }

    It 'emits vnetPeering from a VNet ARG record without a type column' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $peeringsJson = @'
[
  {
    "name": "peer-to-hub",
    "properties": {
      "remoteVirtualNetwork": {
        "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub"
      }
    }
  }
]
'@

        Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord `
            -Rows $rows `
            -Seen $seen `
            -VNetResourceId '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke' `
            -SubnetsJson '[]' `
            -PeeringsJson $peeringsJson

        $rows.Count | Should -Be 1
        $rows[0].associationType | Should -Be 'vnetPeering'
        $rows[0].toResourceId | Should -Match 'virtualNetworks/hub'
    }
}
