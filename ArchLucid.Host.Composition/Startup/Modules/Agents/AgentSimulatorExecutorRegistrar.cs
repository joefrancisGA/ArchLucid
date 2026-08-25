// Simulator-mode agent executor registrations (extracted from AgentExecutionCompositionModule).

using ArchLucid.AgentRuntime;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
///     Deterministic simulator executor chain for <c>AgentExecution:Mode=Simulator</c>.
/// </summary>
internal static class AgentSimulatorExecutorRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<DeterministicAgentSimulator>();
        services.AddScoped<IdempotentAgentExecutor>(static sp =>
            new IdempotentAgentExecutor(
                sp.GetRequiredService<DeterministicAgentSimulator>(),
                sp.GetRequiredService<IAgentResultRepository>(),
                sp.GetRequiredService<IScopeContextProvider>(),
                sp.GetRequiredService<ILogger<IdempotentAgentExecutor>>()));
        services.AddScoped<SimulatorExecutionTraceRecordingExecutor>(static sp =>
            new SimulatorExecutionTraceRecordingExecutor(
                sp.GetRequiredService<IdempotentAgentExecutor>(),
                sp.GetRequiredService<IAgentExecutionTraceRecorder>()));
        services.AddScoped<IAgentExecutor>(static sp => sp.GetRequiredService<SimulatorExecutionTraceRecordingExecutor>());
        services.AddScoped<ITopologyProposalSecondaryCompletionInvoker, NullTopologyProposalSecondaryCompletionInvoker>();
        AgentCompletionPipelineCompositionModule.RegisterFakeClient(services);
    }
}
