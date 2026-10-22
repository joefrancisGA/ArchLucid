using System.Diagnostics;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Evidence;

namespace ArchLucid.AgentRuntime;

internal static partial class RealAgentExecutorStagedCriticExecution
{
    private static async Task<AgentResult[]> ExecuteWithOverlapAsync(
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

        evidence.Notes.Add(new EvidenceNote
        {
            NoteType = EvidenceNoteTypes.StagedCriticOverlapApplied,
            Message =
                "Staged Critic overlap is active: the Critic agent may run before the prior-agent summary is injected. "
                + "PilotStrict enforce/block posture disables overlap; see STAGED_CRITIC_WALL_TIME_CONTRACT.md.",
        });

        int phase1AdmissionCap = StagedCriticOverlapPolicy.ResolvePhase1MaxConcurrentHandlers(
            stagedOpts,
            dependencies.ResilienceOptions.Value.MaxConcurrentHandlers);

        using StagedCriticPhaseAdmissionLimiter? phase1AdmissionLimiter =
            StagedCriticPhaseAdmissionLimiter.TryCreate(phase1AdmissionCap);

        long overlapStartTicks = Stopwatch.GetTimestamp();
        using Activity? phase1Activity = ArchLucidInstrumentation.AgentExecution.StartActivity("AgentExecution.Phase1");
        using Activity? phase2Activity = ArchLucidInstrumentation.AgentExecution.StartActivity("AgentExecution.Phase2_Critic");

        phase1Activity?.SetTag("archlucid.run_id", runId);
        phase1Activity?.SetTag("archlucid.staged_critic.overlap_enabled", true);
        phase2Activity?.SetTag("archlucid.run_id", runId);
        phase2Activity?.SetTag("archlucid.staged_critic.overlap_enabled", true);

        Task<AgentResult[]> phase1Task = ExecutePhase1WithSummaryInjectionAsync(
            dependencies,
            runId,
            request,
            evidence,
            phase1,
            persistedByTaskId,
            stagedOpts,
            phase1AdmissionLimiter,
            linkedCancellation);

        Task<AgentResult[]> phase2Task = TryExecuteStagedCriticPhaseAsync(
            dependencies,
            runId,
            request,
            evidence,
            phase2,
            persistedByTaskId,
            stagedOpts,
            linkedCancellation);

        AgentResult[] phase1Results;
        AgentResult[] phase2Results;

        try
        {
            await Task.WhenAll(phase1Task, phase2Task).ConfigureAwait(false);
            phase1Results = await phase1Task.ConfigureAwait(false);
            phase2Results = await phase2Task.ConfigureAwait(false);
        }
        catch
        {
            if (phase1Task.IsFaulted && phase2Task.IsFaulted)
                throw;

            if (phase1Task.IsFaulted)
                throw phase1Task.Exception!;

            throw phase2Task.Exception!;
        }

        double overlapWallMilliseconds = Stopwatch.GetElapsedTime(overlapStartTicks).TotalMilliseconds;
        int summarizedClaimsCount = CountStagedPriorSummarizedClaimSlots(phase1Results, stagedOpts);
        phase2Activity?.SetTag("archlucid.staged_critic.summarized_claims_count", summarizedClaimsCount);

        StagedCriticPhaseTelemetry.RecordPhaseCompleted(phase1Activity, "phase1", overlapWallMilliseconds);
        StagedCriticPhaseTelemetry.RecordPhaseCompleted(phase2Activity, "phase2", overlapWallMilliseconds);

        return MergePhaseResults(orderedTasks, phase1Results, phase2Results);
    }

    private static async Task<AgentResult[]> ExecutePhase1WithSummaryInjectionAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> phase1,
        IReadOnlyDictionary<string, AgentResult> persistedByTaskId,
        StagedCriticAgentOptions stagedOpts,
        StagedCriticPhaseAdmissionLimiter? phase1AdmissionLimiter,
        CancellationTokenSource linkedCancellation)
    {
        AgentResult[] phase1Results = await RealAgentExecutorParallelPhaseExecution.ExecutePhaseWhenAllAsync(
                dependencies,
                runId,
                request,
                evidence,
                phase1,
                persistedByTaskId,
                linkedCancellation,
                phase1AdmissionLimiter)
            .ConfigureAwait(false);

        await InjectPriorAgentsSummaryAsync(
                dependencies,
                runId,
                evidence,
                phase1Results,
                stagedOpts,
                linkedCancellation.Token)
            .ConfigureAwait(false);

        return phase1Results;
    }
}
