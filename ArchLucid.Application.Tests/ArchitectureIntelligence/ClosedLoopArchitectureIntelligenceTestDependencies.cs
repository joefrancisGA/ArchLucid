using ArchLucid.Application.ArchitectureIntelligence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

internal static class ClosedLoopArchitectureIntelligenceTestDependencies
{
    internal static IServiceCollection AddClosedLoopArchitectureIntelligenceTestDependencies(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        // Host-only authority/graph services require persistence ports absent in lightweight test DI.
        services.RemoveAll<IArchitectureKnowledgeModelAccess>();
        services.RemoveAll<IKnowledgeModelGraphReprojector>();
        services.RemoveAll<IAuthorityFindingsSnapshotUpdater>();

        return services;
    }
}
