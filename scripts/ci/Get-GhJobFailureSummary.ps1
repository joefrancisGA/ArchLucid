# Summarize GitHub Actions job failures without migration DDL noise (FK_ in DbUp scripts).
param(
    [Parameter(Mandatory = $true)]
    [long] $JobId,

    [int] $MaxLines = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repo = 'joefrancisGA/ArchLucid'
$raw = gh api "repos/$repo/actions/jobs/$JobId/logs" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error $raw
    exit 1
}

$patterns = @(
    'Failed ArchLucid[\.\w]+',
    '##\[error\]',
    'Error Message:',
    'Test Run Failed\.',
    'Process completed with exit code [1-9]',
    '::error::',
    'ELIFECYCLE',
    '✖'
)

$skip = @(
    'Executing Database Server script',
    'CONSTRAINT FK_',
    'ALTER TABLE dbo\.FindingsSnapshots ADD CONSTRAINT'
)

$hits = $raw |
    Select-String -Pattern ($patterns -join '|') |
    Where-Object {
        $line = $_.Line
        -not ($skip | Where-Object { $line -match $_ })
    } |
    Select-Object -Last $MaxLines

if (-not $hits) {
    Write-Host "No failure summary lines matched for job $JobId."
    exit 0
}

Write-Host "=== job $JobId failure summary (last $($hits.Count) hits) ==="
$hits | ForEach-Object { Write-Host $_.Line }
