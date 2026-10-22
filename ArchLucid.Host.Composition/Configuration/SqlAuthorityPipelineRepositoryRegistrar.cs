using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Transactions;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.Authority;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Concurrency;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Orchestration.RunStageOutcomes;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Transactions;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for authority pipeline orchestration, query/replay services, and run commit infrastructure.
/// </summary>
internal static class SqlAuthorityPipelineRepositoryRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IManifestFinalizationSqlRepository, SqlManifestFinalizationRepository>();
        services.AddScoped<IRunTelemetryRepository, SqlRunTelemetryRepository>();
        services.AddScoped<IArtifactBundleRepository, SqlArtifactBundleRepository>();
        services.AddScoped<IAuthorityQueryService, DapperAuthorityQueryService>();
        services.AddScoped<IArtifactQueryService, DapperArtifactQueryService>();
        services.AddScoped<IAuthorityCompareService, AuthorityCompareService>();
        services.AddScoped<IAuthorityReplayService, AuthorityReplayService>();
        services.AddScoped<IArchLucidUnitOfWorkFactory, DapperArchLucidUnitOfWorkFactory>();
        services.AddScoped<IDistributedCreateRunIdempotencyLock, SqlSessionDistributedCreateRunIdempotencyLock>();
        services.AddScoped<IAuthorityPipelineWorkRepository, DapperAuthorityPipelineWorkRepository>();
        services.AddScoped<IAsyncAuthorityPipelineModeResolver, FeatureManagementAuthorityPipelineModeResolver>();
        services.AddScoped<IRunStageOutcomesRepository, SqlRunStageOutcomesRepository>();
        services.AddScoped<IAuthorityPipelineStagesExecutor, AuthorityPipelineStagesExecutor>();
        services.AddScoped<IAuthorityCommittedPipelineFinalizer, AuthorityCommittedPipelineFinalizer>();
        services.AddScoped<IAuthorityPipelineStagesExecutionDriver, InlineAuthorityPipelineStagesExecutionDriver>();
        services.AddScoped<SqlAuthorityPipelineTenantExecutionLeaseRepository>();
        services.AddScoped<ITenantAuthorityPipelineConcurrencyGate, SqlTenantAuthorityPipelineConcurrencyGate>();
        services.AddScoped<AuthorityRunOrchestrator>();
        services.AddScoped<IAuthorityRunOrchestrator, DtfAuthorityRunOrchestrator>();
        services.AddScoped<IAuditSqlRetryPolicyProvider, AuditSqlRetryPolicyProvider>();
        ArchLucidStorageServiceCollectionExtensions.RegisterAuditRepository(services, configuration);
    }
}
