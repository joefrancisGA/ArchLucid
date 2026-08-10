using System.Diagnostics;

using ArchLucid.Core.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

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
