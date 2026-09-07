#Requires -Version 5.1
<#
.SYNOPSIS
  Merge multiple seeder preview dumps with cross-source dedup (ABQ-43).

.DESCRIPTION
  Calls al_bug_seed_preview_merge.py on one or more preview markdown files.
  Does not write the ledger. Cap 15 by default.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [string[]] $PreviewPaths,

    [int] $Cap = 15
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$mergeScript = Join-Path $PSScriptRoot 'al_bug_seed_preview_merge.py'
if (-not (Test-Path -LiteralPath $mergeScript)) {
    throw "Missing merge script: $mergeScript"
}

$args = @()
foreach ($path in @($PreviewPaths)) {
    if (-not [string]::IsNullOrWhiteSpace($path)) {
        $args += $path
    }
}

$args += @('--cap', "$Cap")
& python3 $mergeScript @args
