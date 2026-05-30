using System.Diagnostics;

using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

internal static class RealAgentExecutorStagedCriticExecution
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

        AgentTask[] phase1 = orderedTasks.Where(static t => t.AgentType != AgentType.Critic).ToArray();
        AgentTask[] phase2 = orderedTasks.Where(static t => t.AgentType == AgentType.Critic).ToArray();

        AgentResult[] phase1Results;
        using (Activity? phase1Activity = ArchLucidInstrumentation.AgentExecution.StartActivity("AgentExecution.Phase1"))
        {
            phase1Activity?.SetTag("archlucid.run_id", runId);

            phase1Results = await RealAgentExecutorParallelPhaseExecution.ExecutePhaseWhenAllAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    phase1,
                    persistedByTaskId,
                    linkedCancellation)
                .ConfigureAwait(false);
        }

        ReplaceStagedPriorSummaryNotes(evidence);
        EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote(phase1Results, stagedOpts);
        evidence.Notes.Add(note);

        int summarizedClaimsCount = CountStagedPriorSummarizedClaimSlots(phase1Results, stagedOpts);

        AgentResult[] phase2Results;
        using (Activity? phase2Activity = ArchLucidInstrumentation.AgentExecution.StartActivity("AgentExecution.Phase2_Critic"))
        {
            phase2Activity?.SetTag("archlucid.run_id", runId);
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
        }

        Dictionary<string, AgentResult> byTaskId = new(StringComparer.Ordinal);

        foreach (AgentResult result in phase1Results)
            byTaskId[result.TaskId] = result;

        foreach (AgentResult result in phase2Results)
            byTaskId[result.TaskId] = result;

        return orderedTasks.Select(task => byTaskId[task.TaskId]).ToArray();
    }

    private static async Task<AgentResult[]> TryExecuteStagedCriticPhaseAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> criticTasks,
        IReadOnlyDictionary<string, AgentResult> persistedByTaskId,
        StagedCriticAgentOptions stagedOpts,
        CancellationTokenSource linkedCancellation)
    {
        if (criticTasks.Count == 0)
            return [];

        if (stagedOpts.CriticTimeoutSeconds <= 0)
        {
            return await RealAgentExecutorParallelPhaseExecution.ExecutePhaseWhenAllAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    criticTasks,
                    persistedByTaskId,
                    linkedCancellation)
                .ConfigureAwait(false);
        }

        using CancellationTokenSource criticPhaseCancellation =
            CancellationTokenSource.CreateLinkedTokenSource(linkedCancellation.Token);

        criticPhaseCancellation.CancelAfter(TimeSpan.FromSeconds(stagedOpts.CriticTimeoutSeconds));

        try
        {
            return await RealAgentExecutorParallelPhaseExecution.ExecutePhaseWhenAllAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    criticTasks,
                    persistedByTaskId,
                    criticPhaseCancellation)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (IsStagedCriticPhaseTimeout(ex, criticPhaseCancellation, linkedCancellation))
        {
            if (dependencies.Logger.IsEnabled(LogLevel.Warning))
            {
                dependencies.Logger.LogWarning(
                    ex,
                    "Staged Critic phase timed out after {TimeoutSeconds}s for RunId={RunId}; continuing without Critic output.",
                    stagedOpts.CriticTimeoutSeconds,
                    runId);
            }

            evidence.Notes.Add(new EvidenceNote
            {
                NoteType = EvidenceNoteTypes.CriticTimeout,
                Message =
                    $"Staged Critic phase exceeded the dedicated {stagedOpts.CriticTimeoutSeconds}s timeout; Critic output was skipped.",
            });

            return StagedCriticSkippedResultFactory.CreateSkippedResults(
                runId,
                criticTasks,
                stagedOpts.CriticTimeoutSeconds);
        }
    }

    private static bool IsStagedCriticPhaseTimeout(
        Exception ex,
        CancellationTokenSource criticPhaseCancellation,
        CancellationTokenSource linkedCancellation)
    {
        if (criticPhaseCancellation.IsCancellationRequested && !linkedCancellation.IsCancellationRequested)
            return true;

        for (Exception? walker = ex; walker is not null; walker = walker.InnerException)
        {
            if (walker is OperationCanceledException
                && criticPhaseCancellation.IsCancellationRequested
                && !linkedCancellation.IsCancellationRequested)
                return true;
        }

        return false;
    }

    private static void ReplaceStagedPriorSummaryNotes(AgentEvidencePackage evidence)
    {
        ArgumentNullException.ThrowIfNull(evidence);

        evidence.Notes.RemoveAll(static note =>
            EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(note.NoteType, StringComparison.Ordinal));
    }

    private static int CountStagedPriorSummarizedClaimSlots(
        IReadOnlyList<AgentResult> phase1Results,
        StagedCriticAgentOptions options)
    {
        ArgumentNullException.ThrowIfNull(phase1Results);
        ArgumentNullException.ThrowIfNull(options);

        if (options.MaxClaimsPerAgentIncluded <= 0)
            return 0;

        return phase1Results.Sum(result => Math.Min(result.Claims.Count, options.MaxClaimsPerAgentIncluded));
    }
}
