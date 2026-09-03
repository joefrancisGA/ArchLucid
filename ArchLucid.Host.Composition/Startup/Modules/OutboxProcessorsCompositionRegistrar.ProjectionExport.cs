// Outbox-processor composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Coordination.Cosmos;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Host.Core.Coordination.Export;
using ArchLucid.Host.Core.Coordination.Projection;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Cosmos;

namespace ArchLucid.Host.Composition.Startup.Modules;

internal static partial class OutboxProcessorsCompositionRegistrar
{
    internal static void RegisterProjectionExport(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterRunExportBlobPushOutbox(services, hostingRole);
        RegisterPostCommitProjectionOutbox(services, hostingRole);
        RegisterCosmosGraphSnapshotOutbox(services, configuration, hostingRole);
    }

    internal static void RegisterRunExportBlobPushOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IRunExportBlobPushOutboxProcessor, RunExportBlobPushOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<RunExportBlobPushOutboxHostedService>();
    }

    internal static void RegisterPostCommitProjectionOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IPostCommitProjectionOutboxProcessor, PostCommitProjectionOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<PostCommitProjectionOutboxHostedService>();
    }

    internal static void RegisterCosmosGraphSnapshotOutbox(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArchLucidOptions archLucid = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (!ArchLucidOptions.EffectiveIsSql(archLucid.StorageProvider))
            return;

        // The processor resolves CosmosGraphSnapshotRepository (concrete) at runtime, which is only registered
        // when GraphSnapshotsEnabled=true. Skip registration entirely when the feature is off: there are no
        // Cosmos writes to drain, and running the hosted service would throw InvalidOperationException every
        // poll cycle.
        CosmosDbOptions cosmosOpts =
            configuration.GetSection(CosmosDbOptions.SectionName).Get<CosmosDbOptions>() ?? new CosmosDbOptions();

        if (!cosmosOpts.GraphSnapshotsEnabled)
            return;

        services.AddScoped<ICosmosGraphSnapshotOutboxSqlLoader, CosmosGraphSnapshotOutboxSqlLoader>();
        services.AddScoped<ICosmosGraphSnapshotOutboxCosmosWriter, CosmosGraphSnapshotOutboxCosmosWriter>();
        services.AddSingleton<ICosmosGraphSnapshotOutboxProcessor, CosmosGraphSnapshotOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<CosmosGraphSnapshotOutboxHostedService>();
    }
}
