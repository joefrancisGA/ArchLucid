#Requires -Version 5.1
param([string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path, [string]$CsvOut = "")
$stacks = @("infra/terraform","infra/terraform-monitoring","infra/terraform-container-apps","infra/terraform-sql-failover","infra/terraform-storage","infra/terraform-private","infra/terraform-edge","infra/terraform-entra","infra/terraform-openai","infra/terraform-logicapps","infra/terraform-keyvault","infra/terraform-servicebus","infra/terraform-orchestrator","infra/terraform-otel-collector")
if ([string]::IsNullOrWhiteSpace($CsvOut)) { $CsvOut = Join-Path $RepoRoot "terraform-archiforge-addresses-dry-run.csv" }
$rows = New-Object System.Collections.Generic.List[object]
foreach ($relative in $stacks) {
  $stackPath = Join-Path $RepoRoot $relative
  if (-not (Test-Path -LiteralPath $stackPath)) { Write-Warning "Skip missing stack: $relative"; continue }
  Push-Location $stackPath
  try {
    $listOutput = & terraform state list 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Warning "terraform state list failed for $relative"; continue }
    foreach ($address in ($listOutput | Where-Object { $_ -match "archiforge" })) {
      $suggested = $address -replace "archiforge","archlucid"
      $rows.Add([pscustomobject]@{ Stack=$relative; LegacyAddress=$address; SuggestedTarget=$suggested }) | Out-Null
      Write-Host "terraform state mv '$address' '$suggested'"
    }
  } finally { Pop-Location }
}
if ($rows.Count -gt 0) { $rows | Export-Csv -Path $CsvOut -NoTypeInformation -Encoding UTF8; Write-Host "Wrote $($rows.Count) row(s) to $CsvOut" }
