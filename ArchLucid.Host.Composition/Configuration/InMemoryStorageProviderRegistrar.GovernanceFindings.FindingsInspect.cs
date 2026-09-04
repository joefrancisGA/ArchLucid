using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Host.Composition.GoToMarket;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Governance.Posture;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Support;
using ArchLucid.Persistence.WeeklyDigest;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterGovernanceFindingsFindingsInspect(IServiceCollection services)
    {
        services.AddSingleton<IFindingsSnapshotRepository>(static sp =>
            new InMemoryFindingsSnapshotRepository(sp.GetRequiredService<IScopeContextProvider>()));
        services.AddSingleton<IFindingRecordMuteRepository, InMemoryFindingRecordMuteRepository>();
        services.AddSingleton<IFindingRecordRemediationAssignmentRepository, InMemoryFindingRecordRemediationAssignmentRepository>();
        services.AddSingleton<IFindingInspectReadRepository>(sp =>
            new InMemoryFindingInspectReadRepository(sp.GetRequiredService<IAuthorityQueryService>()));
        services.AddSingleton<IDecisionTraceRepository, InMemoryDecisionTraceRepository>();
        services.AddSingleton<IAdminNotificationsRepository, NoOpAdminNotificationsRepository>();
        services.AddSingleton<IRoiBulletinAggregateReader, InMemoryRoiBulletinAggregateReader>();
        services.AddSingleton<IReferenceEvidenceRunLookup, InMemoryReferenceEvidenceRunLookup>();
        services.AddSingleton<ITenantNotificationChannelPreferencesRepository, InMemoryTenantNotificationChannelPreferencesRepository>();
        services.AddSingleton<IOperatorSavedViewRepository, InMemoryOperatorSavedViewRepository>();
        services.AddSingleton<ISupportProblemReportRepository, InMemorySupportProblemReportRepository>();
        services.AddSingleton<IDraftRequestRepository, InMemoryDraftRequestRepository>();
        services.AddSingleton<IWeeklyArchitectureCriticalFindingSummaryRepository,
            InMemoryWeeklyArchitectureCriticalFindingSummaryRepository>();
        services.AddSingleton<IFindingFeedbackRepository, InMemoryFindingFeedbackRepository>();
        services.AddSingleton<IFindingReviewTrailRepository, NoOpFindingReviewTrailRepository>();
        services.AddSingleton<IRiskExceptionRepository, NoOpRiskExceptionRepository>();
        services.AddSingleton<IArchitectureRiskRegisterQuery, NoOpArchitectureRiskRegisterQuery>();
        services.AddSingleton<IArchitecturePostureReader, NoOpArchitecturePostureReader>();
        services.AddSingleton<IAgentToolInvocationRecordRepository, InMemoryAgentToolInvocationRecordRepository>();
        services.AddSingleton<IArchitectureDecisionRegisterQuery, NoOpArchitectureDecisionRegisterQuery>();
        services.AddSingleton<IImportedArchitectureRequestRepository, NoOpImportedArchitectureRequestRepository>();
        services.AddSingleton<IAzureExtractorPackageRepository, NoOpAzureExtractorPackageRepository>();
        services.AddSingleton<ICloudInventoryExtractorPackageRepository, NoOpCloudInventoryExtractorPackageRepository>();
        services.AddSingleton<IAzureInventorySnapshotRepository, NoOpAzureInventorySnapshotRepository>();
        services.AddSingleton<IAzureInventoryDiffRepository, NoOpAzureInventoryDiffRepository>();
        services.AddSingleton<IAzureInventoryBaselineRepository, NoOpAzureInventoryBaselineRepository>();
        services.AddSingleton<IAzureInventoryDriftApprovalRepository, NoOpAzureInventoryDriftApprovalRepository>();
        services.AddSingleton<IAzureInventoryDiffNarrativeRepository, NoOpAzureInventoryDiffNarrativeRepository>();
        services.AddSingleton<IAdvisoryTerraformRepresentationRepository, NoOpAdvisoryTerraformRepresentationRepository>();
        services.AddSingleton<ICloudResourceIdentityDirectory, NoOpCloudResourceIdentityDirectory>();
        services.AddSingleton<IAuditFrameworkRepository, NoOpAuditFrameworkRepository>();
        services.AddSingleton<IAuditEvidenceRequirementRepository, NoOpAuditEvidenceRequirementRepository>();
        services.AddSingleton<ITenantBrandingProfileRepository, InMemoryTenantBrandingProfileRepository>();
    }
}
