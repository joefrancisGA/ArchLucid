using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Services;

public partial class FindingsOrchestrator(
    IEnumerable<IFindingEngine> engines,
    IFindingPayloadValidator validator,
    ILogger<FindingsOrchestrator> logger,
    IOptions<HumanReviewFindingOptions> humanReviewOptions,
    IInsightDensityGate insightDensityGate,
    TimeProvider? timeProvider = null,
    IEnumerable<IEffectfulFindingEngine>? effectfulEngines = null)
    : IFindingsOrchestrator
{
    private readonly IOptions<HumanReviewFindingOptions> _humanReviewOptions =
        humanReviewOptions ?? throw new ArgumentNullException(nameof(humanReviewOptions));

    private readonly IInsightDensityGate _insightDensityGate =
        insightDensityGate ?? throw new ArgumentNullException(nameof(insightDensityGate));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    public async Task<FindingsSnapshot> GenerateFindingsSnapshotAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(engines);

        List<Finding> allFindings = [];
        List<FindingEngineFailure> engineFailures = [];
        List<Exception> engineExceptions = [];
        int successfulEngineInvocations = 0;

        IReadOnlyList<EngineAdapter> adapters = EngineAdapter.FromEngines(engines, effectfulEngines);
        Task<EngineInvocationOutcome>[] invocationTasks = adapters
            .Select(adapter => InvokeEngineAsync(adapter, graphSnapshot, ct))
            .ToArray();

        EngineInvocationOutcome[] outcomes = await AwaitEngineInvocationsAsync(invocationTasks);
        EngineInvocationOutcome[] orderedOutcomes = outcomes
            .OrderBy(static outcome => outcome.Engine.EngineType, StringComparer.Ordinal)
            .ToArray();

        foreach (EngineInvocationOutcome outcome in orderedOutcomes)
        {
            EngineAdapter engine = outcome.Engine;

            if (outcome.Exception is not null)
            {
                Exception ex = outcome.Exception;
                LogEngineFailed(ex, runId, engine.EngineType, engine.Category, outcome.DurationMs);
                ArchLucidInstrumentation.RecordFindingEngineFailure(engine.EngineType, engine.Category);
                engineExceptions.Add(ex);
                engineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = engine.EngineType,
                        Category = engine.Category,
                        ErrorMessage = ex.Message,
                        ExceptionType = ex.GetType().Name,
                        DurationMs = outcome.DurationMs,
                        OccurredUtc = _clock.UtcNowDateTime()
                    });

                continue;
            }

            IReadOnlyList<Finding> findings = outcome.Findings ?? [];

            successfulEngineInvocations++;
            LogEngineCompleted(runId, engine.EngineType, engine.Category, outcome.DurationMs, findings.Count);

            foreach (Finding finding in findings)
            {

                if (string.IsNullOrWhiteSpace(finding.Category))
                    finding.Category = engine.Category;

                if (!TryAcceptValidatedFinding(
                        validator,
                        finding,
                        engine,
                        engineFailures,
                        out string? rejectionReason))
                {
                    LogFindingPayloadRejected(runId, engine.EngineType, finding.FindingId, rejectionReason!);
                    continue;
                }

                if (!string.Equals(finding.Category, engine.Category, StringComparison.OrdinalIgnoreCase))

                    throw new InvalidOperationException(
                        $"Finding category '{finding.Category}' did not match engine category '{engine.Category}' for engine '{engine.EngineType}'.");

                allFindings.Add(finding);
            }
        }

        if (successfulEngineInvocations == 0 && engineExceptions.Count > 0)
            throw new AggregateException("All finding engines failed for this snapshot.", engineExceptions);

        FindingSnapshotMergeResult mergeResult = FindingSnapshotConfluentMerger.Merge(allFindings, _clock);

        foreach (FindingEngineFailure conflict in mergeResult.Conflicts)
        {
            engineFailures.Add(conflict);
            ArchLucidInstrumentation.RecordFindingEngineFailure(conflict.EngineType, conflict.Category);
        }

        List<Finding> dedupedFindings = [.. mergeResult.Findings];

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshot.GraphSnapshotId,
            CreatedUtc = _clock.UtcNowDateTime(),
            Findings = dedupedFindings,
            EngineFailures = engineFailures,
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion
        };

        FindingHumanReviewInitializer.Apply(snapshot.Findings, _humanReviewOptions.Value);

        foreach (Finding finding in snapshot.Findings)
            FindingEnforcementTierClassifier.ApplyToFinding(finding);

        FindingInsightDensityGateApplicator.ApplyToFindings(snapshot.Findings, _insightDensityGate);

        snapshot.TotalEstimatedSavings = FindingsSnapshotEstimatedSavingsCalculator.ComputeTotal(snapshot.Findings);

        FindingsSnapshotMigrator.Apply(snapshot);

        snapshot.GenerationStatus = engineFailures.Count switch
        {
            0 => FindingsSnapshotGenerationStatus.Complete,
            _ when dedupedFindings.Count > 0 => FindingsSnapshotGenerationStatus.PartiallyComplete,
            _ => FindingsSnapshotGenerationStatus.Failed
        };

        if (engineFailures.Count > 0 && successfulEngineInvocations > 0)
        {
            ArchLucidInstrumentation.RecordFindingsEnginePartialFailure();
            LogPartialEngineFailures(runId, engineFailures.Count);
        }

        LogSnapshotBuilt(runId, snapshot.FindingsSnapshotId, snapshot.Findings.Count, snapshot.SchemaVersion);

        return snapshot;
    }

    private static async Task<EngineInvocationOutcome[]> AwaitEngineInvocationsAsync(
        Task<EngineInvocationOutcome>[] invocationTasks)
    {
        try
        {
            return await Task.WhenAll(invocationTasks);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (AggregateException aggregate) when (aggregate.InnerExceptions.Count == 1
                                                   && aggregate.InnerExceptions[0] is OperationCanceledException canceled)
        {
            throw canceled;
        }
    }

    private async Task<EngineInvocationOutcome> InvokeEngineAsync(
        EngineAdapter engine,
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graphSnapshot, ct);
            sw.Stop();

            return new EngineInvocationOutcome(engine, findings, null, sw.ElapsedMilliseconds);
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            throw;
        }
        catch (Exception ex)
        {
            sw.Stop();

            return new EngineInvocationOutcome(engine, null, ex, sw.ElapsedMilliseconds);
        }
    }

    private sealed record EngineInvocationOutcome(
        EngineAdapter Engine,
        IReadOnlyList<Finding>? Findings,
        Exception? Exception,
        long DurationMs);

    private bool TryAcceptValidatedFinding(
        IFindingPayloadValidator validator,
        Finding finding,
        EngineAdapter engine,
        List<FindingEngineFailure> engineFailures,
        out string? rejectionReason)
    {
        if (FindingPayloadValidatorExtensions.TryValidate(validator, finding, out rejectionReason))
            return true;

        engineFailures.Add(
            new FindingEngineFailure
            {
                EngineType = engine.EngineType,
                Category = engine.Category,
                ErrorMessage =
                    $"Dropped finding '{finding.FindingId}' ({finding.FindingType}): {rejectionReason}",
                ExceptionType = nameof(InvalidOperationException),
                DurationMs = 0,
                OccurredUtc = _clock.UtcNowDateTime(),
            });

        ArchLucidInstrumentation.RecordFindingEngineFailure(engine.EngineType, engine.Category);
        return false;
    }

    [LoggerMessage(
        EventId = 5,
        Level = LogLevel.Warning,
        Message =
            "Finding payload rejected: RunId={RunId} EngineType={EngineType} FindingId={FindingId} Reason={Reason}")]
    private partial void LogFindingPayloadRejected(Guid runId, string engineType, string findingId, string reason);

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Error,
        Message =
            "Finding engine failed: RunId={RunId} EngineType={EngineType} Category={Category} DurationMs={DurationMs}")]
    private partial void LogEngineFailed(Exception ex, Guid runId, string engineType, string category, long durationMs);

    [LoggerMessage(
        EventId = 2,
        Level = LogLevel.Information,
        Message =
            "Finding engine completed: RunId={RunId} EngineType={EngineType} Category={Category} DurationMs={DurationMs} FindingsCount={Count}")]
    private partial void LogEngineCompleted(Guid runId, string engineType, string category, long durationMs, int count);

    [LoggerMessage(
        EventId = 3,
        Level = LogLevel.Information,
        Message =
            "Findings snapshot built: RunId={RunId} FindingsSnapshotId={SnapshotId} TotalFindings={Total} SchemaVersion={SchemaVersion}")]
    private partial void LogSnapshotBuilt(Guid runId, Guid snapshotId, int total, int schemaVersion);

    [LoggerMessage(
        EventId = 4,
        Level = LogLevel.Warning,
        Message = "Findings snapshot built with engine failures: RunId={RunId} FailedEngineCount={FailedEngineCount}")]
    private partial void LogPartialEngineFailures(Guid runId, int failedEngineCount);
}
