using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions;
using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Application.InfraEvidence.SecurityCrosswalk;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Infrastructure-evidence plane application and persistence registrations.</summary>
public static class InfraEvidenceCompositionModule
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IAzureInventorySnapshotHeaderService, AzureInventorySnapshotHeaderService>();
        services.AddScoped<IAzureInventorySnapshotMaterializer, AzureInventorySnapshotMaterializer>();
        services.AddScoped<IAzureInventoryDiffService, AzureInventoryDiffService>();
        services.AddScoped<IAdvisoryTerraformRepresentationService, AdvisoryTerraformRepresentationService>();
        services.AddScoped<IAzureInventoryBaselineService, AzureInventoryBaselineService>();
        services.AddScoped<IAzureInventoryDriftClassificationService, AzureInventoryDriftClassificationService>();
        services.AddScoped<IAzureInventoryDriftApprovalService, AzureInventoryDriftApprovalService>();
        services.AddScoped<IAzureInventoryDiffNarrativeService, AzureInventoryDiffNarrativeService>();
        services.AddScoped<IInfraEvidenceDriftWorkbenchQueryService, InfraEvidenceDriftWorkbenchQueryService>();
        services.AddScoped<IAzureInventorySnapshotGraphResolver, AzureInventorySnapshotGraphResolver>();
        services.AddSingleton(new MermaidDiagramReadabilityThresholds());
        services.AddScoped<IInfraEvidenceSnapshotMermaidService, InfraEvidenceSnapshotMermaidService>();
        services.AddScoped<IAuditFrameworkImportService, AuditFrameworkImportService>();
        services.AddScoped<IAuditEvidenceSelectionService, AuditEvidenceSelectionService>();
        services.AddScoped<IAuditControlEvaluationService, AuditControlEvaluationService>();
        services.AddScoped<IAuditEvidenceSnapshotCollectionService, AuditEvidenceSnapshotCollectionService>();
        services.AddScoped<IAuditEvidenceSnapshotVerificationService, AuditEvidenceSnapshotVerificationService>();
        services.AddScoped<IAuditEvidenceSnapshotQueryService, AuditEvidenceSnapshotQueryService>();
        services.AddScoped<IAuditEvidenceFreshnessService, AuditEvidenceFreshnessService>();
        services.AddScoped<IAuditReadinessService, AuditReadinessService>();
        services.AddScoped<IAuditManualEvidenceSubmissionService, AuditManualEvidenceSubmissionService>();
        services.AddScoped<IAuditHybridEvidenceQueryService, AuditHybridEvidenceQueryService>();
        services.AddScoped<IAuditEvidencePackageExportService, AuditEvidencePackageExportService>();
        services.AddScoped<IAuditEvidenceLineageService, AuditEvidenceLineageService>();
        services.AddScoped<ISecurityCrosswalkService, SecurityCrosswalkService>();
        services.AddScoped<IOperationalSecurityFindingIngestService, OperationalSecurityFindingIngestService>();
        services.AddScoped<IOperationalSecurityExceptionService, OperationalSecurityExceptionService>();
        services.AddScoped<IRemediationPatternService, RemediationPatternService>();
        services.AddScoped<IRemediationPatternMatcherService, RemediationPatternMatcherService>();
        services.AddScoped<IRemediationInstanceService, RemediationInstanceService>();
        services.AddScoped<IRemediationPrioritizationService, RemediationPrioritizationService>();
        services.AddScoped<IRemediationWaveService, RemediationWaveService>();
        services.AddScoped<IRemediationFactoryMetricsService, RemediationFactoryMetricsService>();
        services.AddScoped<IAuditContinuousReadinessService, AuditContinuousReadinessService>();
        services.AddScoped<IAuditEvaluationFindingHandoffService, AuditEvaluationFindingHandoffService>();
        services.AddScoped<IAzureInventorySnapshotPostMaterializeCoordinator, AzureInventorySnapshotPostMaterializeCoordinator>();
        services.AddScoped<IAuditEvidenceSelectorRegistry, AuditEvidenceSelectorRegistry>();
        services.AddScoped<InventoryAuditEvidenceSelector>();
        services.AddScoped<IdentityAuditEvidenceSelector>();
        services.AddScoped<RbacAuditEvidenceSelector>();
        services.AddScoped<NetworkAuditEvidenceSelector>();
        services.AddScoped<DataAuditEvidenceSelector>();
        services.AddScoped<LoggingAuditEvidenceSelector>();
        services.AddScoped<GovernanceAuditEvidenceSelector>();
        services.AddScoped<PostureAuditEvidenceSelector>();
        services.AddScoped<ResilienceAuditEvidenceSelector>();
        services.AddScoped<IAzureInventoryDiffConsumer, AuditContinuousReadinessDiffConsumer>();
        services.AddScoped<IStructuredDiagramIngestService, StructuredDiagramIngestService>();
        services.AddScoped<IDiagramInfrastructureReconciliationService, DiagramInfrastructureReconciliationService>();
        services.AddScoped<IVisionDiagramIngestService, VisionDiagramIngestService>();
        services.AddScoped<ICloudResourceEvidenceHubService, CloudResourceEvidenceHubService>();
        services.AddScoped<IInfraEvidenceAskEvidenceCollector, InfraEvidenceAskEvidenceCollector>();
        services.AddScoped<IInfraEvidenceAskGroundingService, InfraEvidenceAskGroundingService>();
        services.AddScoped<IBrandAssetService, BrandAssetService>();
        services.AddSingleton<TenantBrandingResolvedProfileCache>();
        services.AddSingleton<ITenantBrandingCacheInvalidator>(static sp =>
            sp.GetRequiredService<TenantBrandingResolvedProfileCache>());
        services.AddScoped<ITenantBrandingService, TenantBrandingService>();
        services.AddScoped<ITenantBrandingAdminService, TenantBrandingAdminService>();
        services.AddSingleton<IBrandedDiagramExportComposer, BrandedDiagramExportComposer>();
        services.AddScoped<IBrandedDiagramExportService, BrandedDiagramExportService>();
        services.AddScoped<ITenantReportBrandingApplyHelper, TenantReportBrandingApplyHelper>();
    }
}
