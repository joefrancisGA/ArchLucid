using System.Diagnostics;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime;

internal static partial class RealAgentExecutorStagedCriticExecution
{
    private static async Task<AgentResult[]> ExecuteSerialAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask[] orderedTasks,
        IReadOnlyDictionary<string, AgentResult> persistedByTaskId,
        StagedCriticAgentOptions stagedOpts,
        CancellationTokenSource linkedCancellation)
    {
        AgentTask[] phase1 = orderedTasks.Where(static t => t.AgentType != AgentType.Critic).ToArray();
        AgentTask[] phase2 = orderedTasks.Where(static t => t.AgentType == AgentType.Critic).ToArray();

        AgentResult[] phase1Results;
        long phase1StartTicks = Stopwatch.GetTimestamp();
        using (Activity? phase1Activity = ArchLucidInstrumentation.AgentExecution.StartActivity("AgentExecution.Phase1"))
        {
            phase1Activity?.SetTag("archlucid.run_id", runId);
            phase1Activity?.SetTag("archlucid.staged_critic.overlap_enabled", false);

            phase1Results = await RealAgentExecutorParallelPhaseExecution.ExecutePhaseWhenAllAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    phase1,
                    persistedByTaskId,
                    linkedCancellation)
                .ConfigureAwait(false);

            StagedCriticPhaseTelemetry.RecordPhaseCompleted(
                phase1Activity,
                "phase1",
                Stopwatch.GetElapsedTime(phase1StartTicks).TotalMilliseconds);
        }

        await InjectPriorAgentsSummaryAsync(
                dependencies,
                runId,
                evidence,
                phase1Results,
                stagedOpts,
                linkedCancellation.Token)
            .ConfigureAwait(false);

        int summarizedClaimsCount = CountStagedPriorSummarizedClaimSlots(phase1Results, stagedOpts);

        AgentResult[] phase2Results;
        long phase2StartTicks = Stopwatch.GetTimestamp();
        using (Activity? phase2Activity = ArchLucidInstrumentation.AgentExecution.StartActivity("AgentExecution.Phase2_Critic"))
        {
            phase2Activity?.SetTag("archlucid.run_id", runId);
            phase2Activity?.SetTag("archlucid.staged_critic.overlap_enabled", false);
            phase2Activity?.SetTag("archlucid.staged_critic.summarized_claims_count", summarizedClaimsCount);

            phase2Results = await TryExecuteStagedCriticPhaseAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    phase2,
                    persistedByTaskId,
                    stagedOpts,
                    linkedCancellation)
                .ConfigureAwait(false);

            StagedCriticPhaseTelemetry.RecordPhaseCompleted(
                phase2Activity,
                "phase2",
                Stopwatch.GetElapsedTime(phase2StartTicks).TotalMilliseconds);
        }

        return MergePhaseResults(orderedTasks, phase1Results, phase2Results);
    }
}
