using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime;

internal static partial class RealAgentExecutorStagedCriticExecution
{
    internal static bool ShouldUseStagedCritic(
        StagedCriticAgentOptions stagedOptions,
        IReadOnlyList<AgentTask> orderedTasks)
    {
        return stagedOptions.StagedCriticEnabled
               && orderedTasks.Any(static t => t.AgentType == AgentType.Critic)
               && orderedTasks.Any(static t => t.AgentType != AgentType.Critic);
    }

    internal static async Task<AgentResult[]> ExecuteAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask[] orderedTasks,
        IReadOnlyDictionary<string, AgentResult> persistedByTaskId,
        CancellationTokenSource linkedCancellation)
    {
        StagedCriticAgentOptions stagedOpts = dependencies.StagedCriticOptions.Value;
        stagedOpts.Normalize();

        if (StagedCriticOverlapPolicy.ShouldUseOverlap(stagedOpts, dependencies.AgentOutputBudgetGate.Value))
        {
            return await ExecuteWithOverlapAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    orderedTasks,
                    persistedByTaskId,
                    stagedOpts,
                    linkedCancellation)
                .ConfigureAwait(false);
        }

        return await ExecuteSerialAsync(
                dependencies,
                runId,
                request,
                evidence,
                orderedTasks,
                persistedByTaskId,
                stagedOpts,
                linkedCancellation)
            .ConfigureAwait(false);
    }
}
