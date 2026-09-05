using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.AuditEvidence;
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
<<<<<<< HEAD
=======
        services.AddScoped<IAuditContinuousReadinessService, AuditContinuousReadinessService>();
        services.AddScoped<IAuditEvaluationFindingHandoffService, NoOpAuditEvaluationFindingHandoffService>();
        services.AddScoped<IAzureInventorySnapshotPostMaterializeCoordinator, AzureInventorySnapshotPostMaterializeCoordinator>();
>>>>>>> origin/master
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
    }
}
