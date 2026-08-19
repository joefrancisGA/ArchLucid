<#
.SYNOPSIS
  Concatenate architecture handbook chapters and emit versioned DOCX via Pandoc.

.DESCRIPTION
  Source of truth is Markdown under docs/architecture/architecture_handbook/
  (Full pack), architecture_handbook/buyer/ (Buyer pack), or
  architecture_handbook/security/ (Security reviewer pack).
  For DOCX, diagram references are rewritten from .svg to .png (Pandoc on Windows
  needs raster images unless rsvg-convert is installed). PNG files are produced
  with @mermaid-js/mermaid-cli for every *.mmd under architecture_diagrams when missing
  (unless -SkipPngRender).

.PARAMETER Pack
  Full (default), Buyer, or Security chapter set.

.PARAMETER Version
  Optional version string; defaults to contents of architecture_handbook/VERSION.

.EXAMPLE
  .\scripts\docs\generate-architecture-handbook-docx.ps1 -SkipPngRender

.EXAMPLE
  .\scripts\docs\generate-architecture-handbook-docx.ps1 -Pack Buyer -Version 2026.08.06b

.EXAMPLE
  .\scripts\docs\generate-architecture-handbook-docx.ps1 -Pack Security -SkipPngRender
#>
[CmdletBinding()]
param(
  [string]$RepoRoot = '',
  [ValidateSet('Full', 'Buyer', 'Security')]
  [string]$Pack = 'Full',
  [switch]$SkipDocx,
  [switch]$SkipPngRender,
  [string]$Version = ''
)

Set-StrictMode -Off
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

$handbookDir = Join-Path $RepoRoot 'docs\architecture\architecture_handbook'
$diagramsDir = Join-Path $RepoRoot 'docs\architecture\architecture_diagrams'
$buyerDir = Join-Path $handbookDir 'buyer'
$securityDir = Join-Path $handbookDir 'security'
$versionFile = Join-Path $handbookDir 'VERSION'

if ([string]::IsNullOrWhiteSpace($Version)) {
  if (Test-Path -LiteralPath $versionFile) {
    $Version = (Get-Content -LiteralPath $versionFile -Raw).Trim()
  }
  else {
    $Version = (Get-Date -Format 'yyyy.MM.dd')
  }
}

if ($Pack -eq 'Buyer') {
  $chapterRoot = $buyerDir
  $chapters = @(
    '00-buyer-front-matter.md',
    '01-buyer-system-context.md',
    '02-buyer-authority-pipeline.md',
    '03-buyer-tenant-isolation.md',
    '04-buyer-security-model.md',
    '05-buyer-azure-topology.md',
    '99-buyer-references.md'
  )
  $outMd = Join-Path $buyerDir 'BUYER_TRUST_TOPOLOGY_PACK.generated.md'
  $outDocx = Join-Path $buyerDir 'BUYER_TRUST_TOPOLOGY_PACK.docx'
  $outDocxVersioned = Join-Path $buyerDir ("BUYER_TRUST_TOPOLOGY_PACK.{0}.docx" -f $Version)
  $docTitle = 'ArchLucid buyer trust and topology pack'
  $pandocCwd = $buyerDir
}
elseif ($Pack -eq 'Security') {
  $chapterRoot = $securityDir
  $chapters = @(
    '00-security-front-matter.md',
    '01-security-system-context.md',
    '02-security-tenant-isolation.md',
    '03-security-model.md',
    '04-security-entra-claims.md',
    '05-security-secrets-keyvault.md',
    '06-security-threat-ask-rag.md',
    '07-security-threat-webhooks.md',
    '08-security-content-safety.md',
    '09-security-rate-limiting.md',
    '10-security-commit-sod.md',
    '11-security-audit-catalog.md',
    '12-security-compliance-honesty.md',
    '99-security-references.md'
  )
  $outMd = Join-Path $securityDir 'SECURITY_REVIEWER_PACK.generated.md'
  $outDocx = Join-Path $securityDir 'SECURITY_REVIEWER_PACK.docx'
  $outDocxVersioned = Join-Path $securityDir ("SECURITY_REVIEWER_PACK.{0}.docx" -f $Version)
  $docTitle = 'ArchLucid security reviewer pack'
  $pandocCwd = $securityDir
}
else {
  $chapterRoot = $handbookDir
  $chapters = @(
    '00-front-matter.md',
    '01-system-context.md',
    '02-containers-and-libraries.md',
    '03-authority-pipeline.md',
    '04-authority-vs-coordinator.md',
    '05-async-outbox.md',
    '06-governance-and-policy-packs.md',
    '07-tenant-isolation.md',
    '08-azure-topology.md',
    '09-security-model.md',
    '10-data-persistence.md',
    '11-operator-ui.md',
    '12-exports-comparisons-integrations.md',
    '13-pipeline-stage-zoom-ins.md',
    '14-failure-and-failover.md',
    '15-threat-models.md',
    '16-data-model-er.md',
    '17-config-precedence.md',
    '18-authn-route-matrix.md',
    '19-pilot-day0-day1.md',
    '20-finops-cost.md',
    '21-observability-map.md',
    '22-dr-failover-drill.md',
    '23-policy-pack-sdlc.md',
    '24-api-surface-heatmap.md',
    '25-evidence-intake.md',
    '26-golden-manifest-anatomy.md',
    '27-decision-trace-replay.md',
    '28-billing-trial-marketplace.md',
    '29-scim-users-roles.md',
    '30-digest-alert-subscriptions.md',
    '31-hot-path-performance.md',
    '32-storage-provider-modes.md',
    '33-compliance-claim-honesty.md',
    '34-agent-task-simulator-matrix.md',
    '35-cloud-extractors.md',
    '36-knowledge-graph-model.md',
    '37-findings-taxonomy.md',
    '38-artifact-generator-registry.md',
    '39-comparison-types-catalog.md',
    '40-ask-thread-lifecycle.md',
    '41-hosted-services-inventory.md',
    '42-demo-public-surfaces.md',
    '43-cli-command-map.md',
    '44-terraform-root-order.md',
    '45-llm-provider-adapters.md',
    '46-secrets-keyvault-resolution.md',
    '47-kill-switches-circuit-breakers.md',
    '48-outbound-webhook-delivery.md',
    '49-audit-event-catalog.md',
    '50-dbup-schema-migration.md',
    '51-cache-layers.md',
    '52-blob-content-addressed-layout.md',
    '53-notification-channel-matrix.md',
    '54-rate-limiting-throttling.md',
    '55-private-link-network.md',
    '56-container-deploy-units.md',
    '57-ci-product-pipeline.md',
    '58-golden-cohort-eval.md',
    '59-workspace-project-hierarchy.md',
    '60-entra-role-claims.md',
    '61-correlation-tracing.md',
    '62-content-safety-ingress.md',
    '63-health-checks-catalog.md',
    '64-hosting-roles-split.md',
    '65-mutating-idempotency-keys.md',
    '66-soft-delete-retention-purge.md',
    '67-manifest-commit-sod.md',
    '68-export-package-formats.md',
    '69-openapi-audience-versioning.md',
    '70-sql-open-resilience.md',
    '71-billing-provider-adapters.md',
    '72-ui-bff-proxy-session.md',
    '73-agent-allowed-tools-dispatch.md',
    '74-technology-ledger-lifecycle.md',
    '75-architecture-and-review-engines.md',
    '98-changelog.md',
    '99-references.md'
  )
  $outMd = Join-Path $handbookDir 'ARCHITECTURE_HANDBOOK.generated.md'
  $outDocx = Join-Path $handbookDir 'ARCHITECTURE_HANDBOOK.docx'
  $outDocxVersioned = Join-Path $handbookDir ("ARCHITECTURE_HANDBOOK.{0}.docx" -f $Version)
  $docTitle = 'ArchLucid platform architecture handbook'
  $pandocCwd = $handbookDir
}

if (-not $SkipPngRender) {
  if (-not (Test-Path -LiteralPath $diagramsDir)) {
    throw "Diagrams directory missing: $diagramsDir"
  }

  $mmdFiles = Get-ChildItem -LiteralPath $diagramsDir -Filter '*.mmd' -File

  foreach ($mmdItem in $mmdFiles) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($mmdItem.Name)
    $mmd = $mmdItem.FullName
    $png = Join-Path $diagramsDir ($name + '.png')

    if (Test-Path -LiteralPath $png) {
      continue
    }

    Write-Host ("Rendering PNG: {0}" -f $name)
    $tmpMmd = Join-Path $env:TEMP ("archlucid-mmd-" + $name + '.mmd')
    Copy-Item -LiteralPath $mmd -Destination $tmpMmd -Force
    npx --yes @mermaid-js/mermaid-cli@11 -i $tmpMmd -o $png -b white

    if ($LASTEXITCODE -ne 0) {
      throw "mermaid-cli failed for $name (exit $LASTEXITCODE)"
    }
  }
}

$parts = New-Object System.Collections.Generic.List[string]
$parts.Add('---')
$parts.Add(('title: "{0}"' -f $docTitle))
$parts.Add(('subtitle: "Version {0} — generated from docs/architecture/architecture_handbook"' -f $Version))
$parts.Add('---')
$parts.Add('')

foreach ($name in $chapters) {
  $path = Join-Path $chapterRoot $name

  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing chapter: $path"
  }

  $body = Get-Content -LiteralPath $path -Raw
  # Pandoc DOCX embedding works reliably with PNG on Windows without rsvg-convert.
  $body = $body -replace '\.svg\)', '.png)'
  $parts.Add($body.TrimEnd())
  $parts.Add('')
}

$combined = ($parts -join "`n`n") + "`n"
Set-Content -LiteralPath $outMd -Value $combined -Encoding UTF8
Write-Host "Wrote $outMd"

if ($SkipDocx) {
  Write-Host 'SkipDocx set — leaving DOCX untouched.'
  exit 0
}

$pandoc = Get-Command pandoc -ErrorAction SilentlyContinue

if ($null -eq $pandoc) {
  Write-Warning 'pandoc not found on PATH. Generated Markdown only. Install Pandoc, then re-run.'
  exit 2
}

Push-Location -LiteralPath $pandocCwd
try {
  & pandoc @(
    $outMd
    '-o', $outDocx
    '--from', 'markdown'
    '--resource-path', "$pandocCwd;$handbookDir;$diagramsDir;$buyerDir;$securityDir"
    '--toc'
    '--toc-depth', '2'
  )

  if ($LASTEXITCODE -ne 0) {
    throw "pandoc exited $LASTEXITCODE"
  }

  Copy-Item -LiteralPath $outDocx -Destination $outDocxVersioned -Force
}
finally {
  Pop-Location
}

Write-Host "Wrote $outDocx"
Write-Host "Wrote versioned copy $outDocxVersioned"
exit 0
