using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterExportsGovernance(IServiceCollection services, IConfiguration configuration)
    {
        RegisterExportsGovernanceRunDetailQuery(services);
        RegisterExportsGovernanceGovernanceNotifications(services, configuration);
        RegisterExportsGovernanceReviewExports(services, configuration);
    }
}
