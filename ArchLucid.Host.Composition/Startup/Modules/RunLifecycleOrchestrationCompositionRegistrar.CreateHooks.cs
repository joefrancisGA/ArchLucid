using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Create.Hooks;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterCreateHooks(IServiceCollection services)
    {
        services.AddScoped<ArchitectureRunCreateIdempotencyHelper>();
        services.AddScoped<ArchitectureRunCreatePersistenceHelper>();
        services.AddScoped<ArchitectureRunCreatePostCreateHooks>();
        services.AddScoped<IArchitectureRunCreateAuditHook, ArchitectureRunCreateAuditHook>();
        services.AddScoped<IArchitectureRunCreateMeteringHook, ArchitectureRunCreateMeteringHook>();
        services.AddScoped<IArchitectureRunCreatePolicyBaselineHook, ArchitectureRunCreatePolicyBaselineHook>();
        services.AddScoped<IArchitectureRunCreateIdentityLinkHook, ArchitectureRunCreateIdentityLinkHook>();
        services.AddScoped<IArchitectureRunCreateOrchestrator, ArchitectureRunCreateOrchestrator>();
        services.AddScoped<IArchitectureRunBatchCreateOrchestrator, ArchitectureRunBatchCreateOrchestrator>();
    }
}
