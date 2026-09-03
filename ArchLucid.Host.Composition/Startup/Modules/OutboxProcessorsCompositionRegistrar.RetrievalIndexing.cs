// Outbox-processor composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Host.Core.Coordination.Retrieval;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Persistence.Coordination.Retrieval;

namespace ArchLucid.Host.Composition.Startup.Modules;

internal static partial class OutboxProcessorsCompositionRegistrar
{
    internal static void RegisterRetrievalIndexing(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        RegisterRetrievalIndexingOutbox(services, hostingRole);
    }

    internal static void RegisterRetrievalIndexingOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IRetrievalIndexingOutboxProcessor, RetrievalIndexingOutboxProcessor>();
        services.AddScoped<IAuthorityPipelineWorkHandler, AuthorityPipelineExecuteWorkHandler>();
        services.AddScoped<IAuthorityPipelineWorkHandler, AuthorityPipelineCommitWorkHandler>();
        services.AddScoped<IAuthorityPipelineWorkHandler, AuthorityPipelineExtractorWorkHandler>();
        services.AddSingleton<IAuthorityPipelineWorkProcessor, AuthorityPipelineWorkProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<RetrievalIndexingOutboxHostedService>();
        services.AddHostedService<AuthorityPipelineWorkHostedService>();
    }
}
