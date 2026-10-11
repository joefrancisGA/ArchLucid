#Requires -Version 7.0
<#
.SYNOPSIS
    Parse every PowerShell listing in the book and fail on any parse error.

.DESCRIPTION
    Each .ps1 file under docs/book/lab/listings/powershell is a listing the manuscript copies
    (check_listings.py keeps the two equal). This script parses each file with the PowerShell
    language parser, which catches syntax errors without running anything or calling Azure.
    The book targets PowerShell 7 (Appendix A), and some listings use PowerShell 7 syntax such as
    '??', so Windows PowerShell 5.1 would report false parse errors.
    If PSScriptAnalyzer is installed, its findings are printed as advisories and never fail the run.

.EXAMPLE
    pwsh -NoProfile -File docs/book/tools/check_powershell_listings.ps1
#>
[CmdletBinding()]
param(
    [string] $BookRoot = (Split-Path -Parent $PSScriptRoot)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$folder = Join-Path (Join-Path (Join-Path $BookRoot 'lab') 'listings') 'powershell'
$files = @(Get-ChildItem -LiteralPath $folder -Filter '*.ps1' -File | Sort-Object Name)
$parseErrorCount = 0

foreach ($file in $files) {
    $tokens = $null
    $parseErrors = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$parseErrors)

    foreach ($parseError in $parseErrors) {
        Write-Output ('{0}:{1}: {2}' -f $file.Name, $parseError.Extent.StartLineNumber, $parseError.Message)
        $parseErrorCount++
    }
}

$analyzer = Get-Module -ListAvailable -Name PSScriptAnalyzer | Select-Object -First 1

if ($null -eq $analyzer) {
    Write-Output 'PSScriptAnalyzer is not installed; skipped the advisory lint.'
}
else {
    $findings = @(Invoke-ScriptAnalyzer -Path $folder)

    foreach ($finding in $findings) {
        Write-Output ('advisory {0}:{1}: {2}: {3}' -f $finding.ScriptName, $finding.Line, $finding.RuleName, $finding.Message)
    }
}

Write-Output ('check_powershell_listings: {0} file(s), {1} parse error(s)' -f $files.Count, $parseErrorCount)

if ($parseErrorCount -gt 0) {
    exit 1
}

exit 0
