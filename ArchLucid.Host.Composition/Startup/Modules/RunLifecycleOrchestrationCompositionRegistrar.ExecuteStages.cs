using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Application.Runs.Orchestration.Execute.Hooks;
using ArchLucid.Application.Runs.Orchestration.Pipeline;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterExecuteStages(IServiceCollection services)
    {
        services.AddScoped<ArchitectureRunExecutePostExecuteHooks>();
        services.AddScoped<IArchitectureRunExecuteAuditHook, ArchitectureRunExecuteAuditHook>();
        services.AddScoped<IArchitectureRunExecuteBaselineMutationHook, ArchitectureRunExecuteBaselineMutationHook>();
        services.AddScoped<IArchitectureRunExecuteOutboxPublishHook, ArchitectureRunExecuteOutboxPublishHook>();
        services.AddScoped<IIncompleteAuthorityPipelineExecuteHandler, IncompleteAuthorityPipelineExecuteHandler>();
        services.AddScoped<IArchitectureRunExecuteIdempotencyStage, ArchitectureRunExecuteIdempotencyStage>();
        services.AddScoped<IArchitectureRunExecuteCancellationGuardStage, ArchitectureRunExecuteCancellationGuardStage>();
        services.AddScoped<IArchitectureRunExecutePreExecuteStage, ArchitectureRunExecutePreExecuteStage>();
        services.AddScoped<IArchitectureRunExecutePersistRowsStage, ArchitectureRunExecutePersistRowsStage>();
        services.AddScoped<IArchitectureRunExecutePersistenceStage, ArchitectureRunExecutePersistenceStage>();
        services.AddScoped<IArchitectureRunExecuteQualityGateRetryStage, ArchitectureRunExecuteQualityGateRetryStage>();
        services.AddScoped<IArchitectureRunExecuteQualityGateStage, ArchitectureRunExecuteQualityGateStage>();
        services.AddScoped<IAgentLoopPrepareStage, AgentLoopPrepareStage>();
        services.AddScoped<IAgentLoopInvokeStage, AgentLoopInvokeStage>();
        services.AddScoped<IAgentLoopPersistStage, AgentLoopPersistStage>();
        services.AddScoped<IArchitectureRunExecuteAgentLoopStage, ArchitectureRunExecuteAgentLoopStage>();
        services.AddScoped<IArchitectureRunExecuteScopeResolveStage, ArchitectureRunExecuteScopeResolveStage>();
        services.AddScoped<IArchitectureRunExecuteTelemetryStage, ArchitectureRunExecuteTelemetryStage>();
        services.AddScoped<IArchitectureRunExecuteTailHooksStage, ArchitectureRunExecuteTailHooksStage>();
        services.AddScoped<IArchitectureRunExecuteFailureRecorder, ArchitectureRunExecuteFailureRecorder>();
        services.AddScoped<IArchitectureRunExecuteOrchestrator, ArchitectureRunExecuteOrchestrator>();
    }
}
