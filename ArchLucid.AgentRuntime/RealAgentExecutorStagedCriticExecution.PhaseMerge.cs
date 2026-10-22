using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

internal static partial class RealAgentExecutorStagedCriticExecution
{
    private static async Task InjectPriorAgentsSummaryAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> phase1Results,
        StagedCriticAgentOptions stagedOpts,
        CancellationToken cancellationToken)
    {
        ReplaceStagedPriorSummaryNotes(evidence);
        ScopeContext scope = dependencies.ScopeContextProvider.GetCurrentScope();
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await dependencies.TechnologyLedgerRepository
                .GetByRunIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);
        EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote(phase1Results, stagedOpts, ledgerEntries);
        evidence.Notes.Add(note);
    }

    private static AgentResult[] MergePhaseResults(
        IReadOnlyList<AgentTask> orderedTasks,
        IReadOnlyList<AgentResult> phase1Results,
        IReadOnlyList<AgentResult> phase2Results)
    {
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
                // codeql[cs/log-forging]: run id sanitized for log sink (CWE-117).
                dependencies.Logger.LogWarning(
                    ex,
                    "Staged Critic phase timed out after {TimeoutSeconds}s for RunId={RunId}; continuing without Critic output.",
                    stagedOpts.CriticTimeoutSeconds,
                    LogSanitizer.Sanitize(runId));
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
