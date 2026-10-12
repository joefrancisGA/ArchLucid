Connect-AzAccount -Identity | Out-Null
Connect-MgGraph -Identity | Out-Null

$snapshotDir = Join-Path $PWD ("snapshot-{0:yyyy-MM-ddTHH-mm-ssZ}" -f (Get-Date).ToUniversalTime())
New-Item -ItemType Directory -Path $snapshotDir | Out-Null

$gaps = [System.Collections.Generic.List[object]]::new()
$files = [System.Collections.Generic.List[object]]::new()

function Get-UtcStamp {
    (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
}

function Save-SnapshotFile {
    # Writes one snapshot file and records when, how, and where it was read.
    param(
        [string] $Name, [object[]] $Rows, [string] $QueriedAtUtc,
        [string] $Api, [string] $Module, [string] $Scope, [string] $Source
    )

    ConvertTo-Json -InputObject $Rows -Depth 20 |
        Set-Content (Join-Path $snapshotDir "$Name.json")

    $version = (Get-Module $Module | Select-Object -First 1).Version
    $files.Add([pscustomobject]@{
        name           = "$Name.json"
        rows           = $Rows.Count
        query          = $Source
        api            = $Api
        client         = "$Module $version"
        scope          = $Scope
        queriedAtUtc   = $QueriedAtUtc
        completedAtUtc = Get-UtcStamp
    })
}

function Invoke-ArgQuery {
    param([string] $Name, [string] $Query)

    $queriedAt = Get-UtcStamp
    $rows = [System.Collections.Generic.List[object]]::new()
    $skipToken = $null

    try {
        do {
            # Search-AzGraph returns at most 1,000 rows per call;
            # the skip token fetches the next page.
            $page = if ($skipToken) {
                Search-AzGraph -Query $Query -First 1000 -SkipToken $skipToken -UseTenantScope
            } else {
                Search-AzGraph -Query $Query -First 1000 -UseTenantScope
            }

            $rows.AddRange([object[]] $page.Data)
            $skipToken = $page.SkipToken
        } while ($skipToken)
    }
    catch {
        # A failed query is a gap, never an empty result.
        $gaps.Add([pscustomobject]@{
            kind   = 'partialResult'
            target = $Name
            detail = $_.Exception.Message
        })
    }

    Save-SnapshotFile -Name $Name -Rows ([object[]] $rows) -QueriedAtUtc $queriedAt `
        -Api 'Azure Resource Graph' -Module 'Az.ResourceGraph' -Scope 'tenant' `
        -Source "queries/$Name.kql"
}

Invoke-ArgQuery -Name 'storage-accounts' -Query (Get-Content queries/storage-accounts.kql -Raw)
Invoke-ArgQuery -Name 'role-assignments' -Query (Get-Content queries/role-assignments.kql -Raw)
Invoke-ArgQuery -Name 'subscriptions'    -Query (Get-Content queries/subscriptions.kql -Raw)
