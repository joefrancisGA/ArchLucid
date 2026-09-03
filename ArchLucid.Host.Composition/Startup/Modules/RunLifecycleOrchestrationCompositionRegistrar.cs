// Run lifecycle orchestration composition registrations (extracted from PipelineCompositionModule).

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Run create/execute orchestration, replay, manifest/diff exports, and operator lifecycle registrations.
/// </summary>
internal static partial class RunLifecycleOrchestrationCompositionRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterCoverage(services);
        RegisterCreateHooks(services);
        RegisterExecuteStages(services);
        RegisterFindingsQuery(services);
        RegisterReplayAsync(services, configuration);
        RegisterExportsGovernance(services, configuration);
    }
}
