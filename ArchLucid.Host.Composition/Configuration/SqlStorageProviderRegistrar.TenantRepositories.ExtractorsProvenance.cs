using ArchLucid.Application.Advisory;
using ArchLucid.Application.Provenance;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
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
        services.AddScoped<IAzureInventorySnapshotRepository, SqlAzureInventorySnapshotRepository>();
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
        services.AddScoped<IAuditEvidenceSnapshotRepository, SqlAuditEvidenceSnapshotRepository>();
        services.AddScoped<IAuditManualEvidenceRepository, SqlAuditManualEvidenceRepository>();
        services.AddScoped<IAuditControlTimelineRepository, SqlAuditControlTimelineRepository>();
        services.AddScoped<ISecurityCrosswalkRepository, SqlSecurityCrosswalkRepository>();
        services.AddScoped<IOperationalSecurityFindingRepository, SqlOperationalSecurityFindingRepository>();
        services.AddScoped<IRemediationPatternRepository, SqlRemediationPatternRepository>();
        services.AddScoped<ITenantBrandingProfileRepository, SqlTenantBrandingProfileRepository>();
    }
}
