using ArchLucid.Application.Advisory;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.Provenance;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Search;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.AwsExtractor;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.GcpExtractor;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Search;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Value;
using ArchLucid.Persistence.Architecture;
using ArchLucid.Core.Evidence;
using ArchLucid.Persistence.Evidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Provenance;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    private static void RegisterTenantRepositoriesExtractorsProvenance(IServiceCollection services)
    {
        services.AddScoped<ITenantHostedExtractorConfigurationRepository, SqlTenantHostedExtractorConfigurationRepository>();
        services.AddScoped<ITenantAwsConnectionRepository, SqlTenantAwsConnectionRepository>();
        services.AddScoped<ITenantGcpConnectionRepository, SqlTenantGcpConnectionRepository>();
        services.AddScoped<IGlobalSearchRepository, SqlGlobalSearchRepository>();
        services.AddScoped<ITenantFirstValueReportBrandingRepository, SqlTenantFirstValueReportBrandingRepository>();
        services.AddScoped<IProvenanceSnapshotRepository, SqlProvenanceSnapshotRepository>();
        services.AddScoped<IProvenanceGraphAccessService, ProvenanceGraphAccessService>();
        services.AddScoped<IProvenanceQueryService, ProvenanceQueryService>();
        services.AddScoped<IAzureExtractorPackageRepository, SqlAzureExtractorPackageRepository>();
        services.AddScoped<ICloudInventoryExtractorPackageRepository, SqlCloudInventoryExtractorPackageRepository>();
        services.AddScoped<SqlAzureInventorySnapshotRepository>();
        services.AddScoped<IAzureInventorySnapshotRepository>(static sp =>
            new DeclaredConnectionEnrichedAzureInventorySnapshotRepository(
                sp.GetRequiredService<SqlAzureInventorySnapshotRepository>(),
                sp.GetRequiredService<ISecurityDeclaredConnectionRepository>(),
                sp.GetRequiredService<IOperatorInferredConnectionRepository>()));
        services.AddScoped<IAzureInventoryDiffRepository, SqlAzureInventoryDiffRepository>();
        services.AddScoped<IAzureInventoryBaselineRepository, SqlAzureInventoryBaselineRepository>();
        services.AddScoped<IAzureInventoryDriftApprovalRepository, SqlAzureInventoryDriftApprovalRepository>();
        services.AddScoped<IAzureInventoryDiffNarrativeRepository, SqlAzureInventoryDiffNarrativeRepository>();
        services.AddScoped<IAdvisoryTerraformRepresentationRepository, SqlAdvisoryTerraformRepresentationRepository>();
        services.AddScoped<ICloudResourceIdentityDirectory, SqlCloudResourceIdentityDirectory>();
        services.AddScoped<IAuditFrameworkRepository, SqlAuditFrameworkRepository>();
        services.AddScoped<IAuditEvidenceRequirementRepository, SqlAuditEvidenceRequirementRepository>();
        services.AddScoped<IAuditControlEvaluationRepository, SqlAuditControlEvaluationRepository>();
        services.AddScoped<IAuditAssessmentRepository, SqlAuditAssessmentRepository>();
        services.AddScoped<IProjectScopedAuditAssessmentRepository>(static sp =>
            new ProjectScopedAuditAssessmentRepositoryAdapter(sp.GetRequiredService<IAuditAssessmentRepository>()));
        services.AddScoped<IAuditEvidenceSnapshotRepository, SqlAuditEvidenceSnapshotRepository>();
        services.AddScoped<IProjectScopedAuditEvidenceSnapshotRepository>(static sp =>
            new ProjectScopedAuditEvidenceSnapshotRepositoryAdapter(sp.GetRequiredService<IAuditEvidenceSnapshotRepository>()));
        services.AddScoped<IAuditManualEvidenceRepository, SqlAuditManualEvidenceRepository>();
        services.AddScoped<IAuditControlTimelineRepository, SqlAuditControlTimelineRepository>();
        services.AddScoped<ISecurityCrosswalkRepository, SqlSecurityCrosswalkRepository>();
        services.AddScoped<IOperationalSecurityFindingRepository, SqlOperationalSecurityFindingRepository>();
        services.AddScoped<IProjectScopedOperationalSecurityFindingRepository>(static sp =>
            new ProjectScopedOperationalSecurityFindingRepositoryAdapter(sp.GetRequiredService<IOperationalSecurityFindingRepository>()));
        services.AddScoped<ISecurityEvidencePathRepository, SqlSecurityEvidencePathRepository>();
        services.AddScoped<ISecurityEvidencePathRankRepository, SqlSecurityEvidencePathRankRepository>();
        services.AddScoped<ISecurityEvidenceCutPointRepository, SqlSecurityEvidenceCutPointRepository>();
        services.AddScoped<ISecurityEvidencePathRoutingRepository, SqlSecurityEvidencePathRoutingRepository>();
        services.AddScoped<ISecurityEvidencePathExplanationRepository, SqlSecurityEvidencePathExplanationRepository>();
        services.AddScoped<IOperationalSecurityExceptionRepository, SqlOperationalSecurityExceptionRepository>();
        services.AddScoped<ISecurityAssetAssertionRepository, SqlSecurityAssetAssertionRepository>();
        services.AddScoped<ISecurityDeclaredConnectionRepository, SqlSecurityDeclaredConnectionRepository>();
        services.AddScoped<IOperatorInferredConnectionRepository, SqlOperatorInferredConnectionRepository>();
        services.AddScoped<IRemediationPatternRepository, SqlRemediationPatternRepository>();
        services.AddScoped<IRemediationPatternMatchRepository, SqlRemediationPatternMatchRepository>();
        services.AddScoped<IRemediationInstanceRepository, SqlRemediationInstanceRepository>();
        services.AddScoped<IProjectScopedRemediationInstanceRepository>(static sp =>
            new ProjectScopedRemediationInstanceRepositoryAdapter(sp.GetRequiredService<IRemediationInstanceRepository>()));
        services.AddScoped<IRemediationPrioritizationRepository, SqlRemediationPrioritizationRepository>();
        services.AddScoped<IRemediationWaveRepository, SqlRemediationWaveRepository>();
        services.AddScoped<IRunStoredEvidenceFileRepository, SqlRunStoredEvidenceFileRepository>();
        services.AddScoped<IArchitectureDiagramModelRepository, SqlArchitectureDiagramModelRepository>();
        services.AddScoped<IArchitectureDiagramReconciliationRepository, SqlArchitectureDiagramReconciliationRepository>();
        services.AddScoped<SqlTenantBrandingProfileRepository>();
        services.AddScoped<ITenantBrandingProfileRepository>(static sp =>
            new TenantBrandingProfileRepositoryWithCacheInvalidation(
                sp.GetRequiredService<SqlTenantBrandingProfileRepository>(),
                sp.GetRequiredService<ITenantBrandingCacheInvalidator>()));
        services.AddScoped<IBrandAssetRepository, SqlBrandAssetRepository>();
    }
}
