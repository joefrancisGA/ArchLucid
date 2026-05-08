# Local C# CodeQL mirror: security-extended + repo model pack (via codescanning-config).
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
Set-Location $RepoRoot

if (-not (Get-Command codeql -ErrorAction SilentlyContinue))
{
    throw "Install CodeQL CLI and add to PATH (https://github.com/github/codeql-cli-binaries/releases)."
}

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue))
{
    throw "dotnet SDK not on PATH."
}

if (-not (Get-Command python -ErrorAction SilentlyContinue))
{
    throw "python not on PATH (required for SARIF gate)."
}

$cfg = Join-Path $RepoRoot ".github\codeql\codeql-config.yml"
$outDir = Join-Path $RepoRoot "codeql-out"
$db = Join-Path $outDir "db-csharp"
$sarif = Join-Path $outDir "results-csharp.sarif"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

& codeql database create $db `
    --language=csharp `
    --build-mode=none `
    --source-root=$RepoRoot `
    --codescanning-config=$cfg `
    --command="dotnet restore ArchLucid.sln" `
    --working-dir=$RepoRoot `
    --overwrite

& codeql database analyze $db security-extended `
    --download `
    --format=sarif-latest `
    --output=$sarif `
    --sarif-category=/language:csharp

& python (Join-Path $PSScriptRoot "assert_codeql_sarif_clean.py") $outDir
