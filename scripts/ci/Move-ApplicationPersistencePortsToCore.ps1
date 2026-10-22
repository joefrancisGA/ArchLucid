# Moves Application/AgentRuntime-facing persistence ports and DTOs into Core (Phase 5).
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$core = Join-Path $root 'ArchLucid.Core\Persistence\ApplicationPorts'
$persistence = Join-Path $root 'ArchLucid.Persistence'

$keep = @(
    'Models',
    'Serialization\AuditJsonSerializationOptions.cs',
    'IntegrationOutbox\IIntegrationEventOutboxRepository.cs',
    'IntegrationOutbox\IntegrationEventOutboxEntry.cs',
    'IntegrationOutbox\IntegrationEventOutboxDeadLetterRow.cs',
    'IntegrationOutbox\OutboxAwareIntegrationEventPublishing.cs',
    'Queries\IAuthorityQueryService.cs',
    'Queries\IArtifactQueryService.cs',
    'Queries\RunSummaryDto.cs',
    'Queries\RunDetailDto.cs',
    'Queries\ManifestSummaryDto.cs',
    'Queries\RunExecutionDegradation.cs',
    'Interfaces',
    'Audit\IAuditRepository.cs',
    'Provenance\IProvenanceSnapshotRepository.cs',
    'BlobStore\IArtifactBlobStore.cs',
    'BlobStore\ITenantRegionalArtifactBlobClients.cs',
    'BlobStore\ArtifactBlobTenantPaths.cs',
    'Caching\IHotPathReadCache.cs',
    'Roi\ITenantCostSettingsRepository.cs',
    'Roi\TenantCostSettingsRecord.cs',
    'Tenancy\ITenantSettingsRepository.cs',
    'Tenancy\ITenantFirstValueReportBrandingRepository.cs',
    'Telemetry\IFirstTenantFunnelEventStore.cs',
    'Integrations\IItsmFindingCorrelationRepository.cs',
    'Integrations\ITenantItsmOutboundSettingsRepository.cs',
    'Integrations\ItsmFindingCorrelationRecord.cs',
    'Integrations\TenantItsmOutboundSettings.cs',
    'Pilots\IPilotReportCardMetricsReader.cs',
    'Pilots\IPilotScorecardMetricsReader.cs',
    'Pilots\IPilotBaselineRepository.cs',
    'Pilots\PilotBaselineRecord.cs',
    'Pilots\PilotReportCardScopeMetrics.cs',
    'Pilots\PilotScorecardTenantMetrics.cs',
    'Pilots\PilotReportCardSeverityCountRow.cs',
    'WeeklyDigest\IWeeklyArchitectureCriticalFindingSummaryRepository.cs',
    'WeeklyDigest\WeeklyArchitectureCriticalFindingsSlice.cs',
    'WeeklyDigest\WeeklyArchitectureCriticalFindingDto.cs',
    'Value\IValueReportMetricsReader.cs',
    'Value\ValueReportRawMetrics.cs',
    'AzureExtractorChunkUpload\IAzureExtractorChunkSessionStore.cs',
    'AzureExtractorChunkUpload\AzureExtractorChunkUploadOptions.cs',
    'AzureExtractorChunkUpload\AzureExtractorChunkSessionDescriptor.cs',
    'AzureExtractorChunkUpload\AzureExtractorChunkSessionMetadata.cs',
    'Data\Infrastructure\IDbConnectionFactory.cs',
    'Connections\SqlUniqueConstraintViolationDetector.cs',
    'Connections\SqlTransientDetector.cs',
    'Data\Repositories\IArchitectureRequestRepository.cs',
    'Data\Repositories\IAgentTaskRepository.cs',
    'Data\Repositories\IAgentResultRepository.cs',
    'Data\Repositories\IAgentEvaluationRepository.cs',
    'Data\Repositories\IAgentEvidencePackageRepository.cs',
    'Data\Repositories\IAgentExecutionTraceRepository.cs',
    'Data\Repositories\IAgentOutputEvaluationRepository.cs',
    'Data\Repositories\IAgentOutputEvaluationResultRepository.cs',
    'Data\Repositories\IAgentConfidenceCalibrationSampleRepository.cs',
    'Data\Repositories\IEvidenceBundleRepository.cs',
    'Data\Repositories\IDecisionNodeRepository.cs',
    'Data\Repositories\IComparisonRecordRepository.cs',
    'Data\Repositories\IRunExportRecordRepository.cs',
    'Data\Repositories\IGovernanceApprovalRequestRepository.cs',
    'Data\Repositories\IGovernancePromotionRecordRepository.cs',
    'Data\Repositories\IGovernanceEnvironmentActivationRepository.cs',
    'Data\Repositories\IFindingReviewTrailRepository.cs',
    'Data\Repositories\IImportedArchitectureRequestRepository.cs',
    'Data\Repositories\IAzureExtractorPackageRepository.cs',
    'Data\Repositories\IPromptVariantStatsRepository.cs',
    'Data\Repositories\ITenantCuratedEvidenceRepository.cs',
    'Data\Repositories\ITenantExecDigestPreferencesRepository.cs',
    'Data\Repositories\ITenantNotificationChannelPreferencesRepository.cs',
    'Data\Repositories\ITenantTeamsIncomingWebhookConnectionRepository.cs',
    'Data\Repositories\IArchitectureRunIdempotencyRepository.cs',
    'Data\Repositories\ArchitectureRunIdempotencyLookup.cs',
    'Data\Repositories\TenantCuratedEvidenceEntryRow.cs'
)

function Test-KeepPath {
    param([string]$RelativePath)
    foreach ($entry in $keep) {
        if ($entry -eq 'Models' -and $RelativePath -like 'Models\*') { return $true }
        if ($entry -eq 'Interfaces' -and $RelativePath -like 'Interfaces\*') { return $true }
        if ($RelativePath -eq $entry) { return $true }
    }
    return $false
}

$moved = 0
Get-ChildItem $persistence -Recurse -Filter '*.cs' | ForEach-Object {
    $relativePath = $_.FullName.Substring($persistence.Length + 1)
    if (-not (Test-KeepPath $relativePath)) { return }

    $destination = Join-Path $core $relativePath
    if (Test-Path $destination) { return }

    $destinationDirectory = Split-Path $destination -Parent
    New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
    Move-Item $_.FullName $destination -Force
    $script:moved++
}

Write-Host "Moved $moved files to Core ApplicationPorts."
