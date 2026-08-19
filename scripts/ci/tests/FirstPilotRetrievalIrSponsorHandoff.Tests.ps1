#requires -Version 5.1
Set-StrictMode -Version Latest

Describe 'Add-RetrievalIrEvidenceFinding sponsor handoff' {
    It 'Blocks sponsor handoff when retrieval-ir-report.md is missing' {
        $repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
        $scriptPath = Join-Path $repoRoot 'scripts\collect-first-pilot-proof.ps1'
        $text = Get-Content -LiteralPath $scriptPath -Raw
        $text | Should -Match 'function Add-RetrievalIrEvidenceFinding'
        $text | Should -Match '\[switch\] \$SponsorHandoff'
        $text | Should -Match '\$missingDisposition = if \(\$SponsorHandoff\) \{ ''BLOCK'' \} else \{ ''WARN'' \}'
        $text | Should -Match 'Add-RetrievalIrEvidenceFinding -ProofDirectory \$proofDir -SponsorHandoff:\$SponsorHandoff'
    }
}
