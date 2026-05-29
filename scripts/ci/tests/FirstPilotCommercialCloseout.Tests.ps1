#requires -Version 5.1

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent $here)
. (Join-Path $repoRoot 'FirstPilotCommercialCloseout.ps1')

Describe 'Write-FirstPilotCommercialCloseoutArtifacts' {
    It 'writes HOLD closeout when sponsor disposition is HOLD' {
        $proofDir = Join-Path $TestDrive 'proof-hold'
        New-Item -ItemType Directory -Path $proofDir -Force | Out-Null

        $paths = Write-FirstPilotCommercialCloseoutArtifacts `
            -ProofDirectory $proofDir `
            -SponsorPacketDisposition 'HOLD' `
            -RoiBasisStatus 'not-collected' `
            -RoiSponsorSafe $false `
            -BlockCount 1 `
            -DeferredScopeReasons @() `
            -CommercialStep ([ordered]@{ action = 'Evidence Pack'; owner = 'Sales'; reason = 'Blocking findings present.' }) `
            -DataConsistencyStatus 'HOLD' `
            -ProcurementDisposition 'HOLD'

        Test-Path -LiteralPath $paths.mdPath | Should Be $true
        (Get-Content -LiteralPath $paths.mdPath -Raw) | Should Match 'Evidence Pack'
        (Get-Content -LiteralPath $paths.mdPath -Raw) | Should Match '\*\*HOLD\*\*'
    }

    It 'writes DEFERRED_SCOPE without treating deferred items as V1 failures' {
        $proofDir = Join-Path $TestDrive 'proof-deferred'
        New-Item -ItemType Directory -Path $proofDir -Force | Out-Null

        $paths = Write-FirstPilotCommercialCloseoutArtifacts `
            -ProofDirectory $proofDir `
            -SponsorPacketDisposition 'DEFERRED_SCOPE' `
            -RoiBasisStatus 'buyer-provided' `
            -RoiSponsorSafe $true `
            -BlockCount 0 `
            -DeferredScopeReasons @('Buyer requires SOC 2 CPA attestation (V1.1/(B) deferral).') `
            -CommercialStep ([ordered]@{ action = 'Deferred buyer requirement'; owner = 'Executive owner'; reason = 'Document deferred requirements separately.' }) `
            -DataConsistencyStatus 'PASS' `
            -ProcurementDisposition 'PASS'

        (Get-Content -LiteralPath $paths.mdPath -Raw) | Should Match 'DEFERRED_SCOPE'
        (Get-Content -LiteralPath $paths.mdPath -Raw) | Should Match 'SOC 2 CPA'
    }
}
