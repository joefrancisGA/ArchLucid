// Outbox-processor composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Host.Core.Hosting;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Transactional outbox processors, integration-event publish/consume, and Azure DevOps commit-status publisher.
/// </summary>
internal static partial class OutboxProcessorsCompositionRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterRetrievalIndexing(services, hostingRole);
        RegisterProjectionExport(services, configuration, hostingRole);
        RegisterIntegrationEvents(services, configuration, hostingRole);
    }
}
