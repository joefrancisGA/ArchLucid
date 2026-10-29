using ArchLucid.Application.Advisory;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.SecureNow;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
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
using ArchLucid.Host.Composition.SecureNow;
using ArchLucid.Persistence.Architecture;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Persistence.Evidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.SecureNow;
using ArchLucid.Provenance;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Azure.Storage.Blobs;

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
        services.AddScoped<ICollectionRunRepository, SqlCollectionRunRepository>();
        services.AddScoped<ICollectionTriggerClaimRepository, SqlCollectionTriggerClaimRepository>();
        services.AddScoped<ICollectionRunArtifactReader>(static sp =>
        {
            BlobServiceClient? blobServiceClient = sp.GetService<BlobServiceClient>();
            return blobServiceClient is null
                ? new EmptyCollectionRunArtifactReader()
                : new AzureBlobCollectionRunArtifactReader(
                    blobServiceClient,
                    sp.GetRequiredService<IOptions<CollectionRunStorageOptions>>());
        });
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
        services.AddScoped<ISecurityEvidencePathSearchCoverageRepository, SqlSecurityEvidencePathSearchCoverageRepository>();
        services.AddScoped<ISecurityEvidencePathRankRepository, SqlSecurityEvidencePathRankRepository>();
        services.AddScoped<ISecurityEvidenceCutPointRepository, SqlSecurityEvidenceCutPointRepository>();
        services.AddScoped<ISecurityEvidencePathRoutingRepository, SqlSecurityEvidencePathRoutingRepository>();
        services.AddScoped<ISecurityEvidencePathExplanationRepository, SqlSecurityEvidencePathExplanationRepository>();
        services.AddScoped<IOperationalSecurityExceptionRepository, SqlOperationalSecurityExceptionRepository>();
        services.AddScoped<ISecurityAssetAssertionRepository, SqlSecurityAssetAssertionRepository>();
        services.AddScoped<ISecurityDeclaredConnectionRepository, SqlSecurityDeclaredConnectionRepository>();
        services.AddScoped<IOperatorInferredConnectionRepository, SqlOperatorInferredConnectionRepository>();
        services.AddScoped<ISecureNowQuestionDispositionRepository, SqlSecureNowQuestionDispositionRepository>();
        services.AddScoped<IRemediationPatternRepository, SqlRemediationPatternRepository>();
        services.AddScoped<IRemediationPatternMatchRepository, SqlRemediationPatternMatchRepository>();
        services.AddScoped<IRemediationInstanceRepository, SqlRemediationInstanceRepository>();
        services.AddScoped<IProjectScopedRemediationInstanceRepository>(static sp =>
            new ProjectScopedRemediationInstanceRepositoryAdapter(sp.GetRequiredService<IRemediationInstanceRepository>()));
        services.AddScoped<IVerifiedRemediationControlAssociationRepository, SqlVerifiedRemediationControlAssociationRepository>();
        services.AddScoped<IRemediationPrioritizationRepository, SqlRemediationPrioritizationRepository>();
        services.AddScoped<IRemediationWaveRepository, SqlRemediationWaveRepository>();
        services.AddScoped<IRunStoredEvidenceFileRepository, SqlRunStoredEvidenceFileRepository>();
        services.AddScoped<IArchitectureDiagramModelRepository, SqlArchitectureDiagramModelRepository>();
        services.AddScoped<IArchitectureDiagramReconciliationRepository, SqlArchitectureDiagramReconciliationRepository>();
        services.AddScoped<IInfrastructureDiagramComparisonRepository, SqlInfrastructureDiagramComparisonRepository>();
        services.AddScoped<IInfrastructureDiagramNodeMappingRepository, SqlInfrastructureDiagramNodeMappingRepository>();
        services.AddScoped<IInfrastructureDiagramDocumentationDecisionRepository, SqlInfrastructureDiagramDocumentationDecisionRepository>();
        services.AddScoped<SqlTenantBrandingProfileRepository>();
        services.AddScoped<ITenantBrandingProfileRepository>(static sp =>
            new TenantBrandingProfileRepositoryWithCacheInvalidation(
                sp.GetRequiredService<SqlTenantBrandingProfileRepository>(),
                sp.GetRequiredService<ITenantBrandingCacheInvalidator>()));
        services.AddScoped<IBrandAssetRepository, SqlBrandAssetRepository>();
    }
}
