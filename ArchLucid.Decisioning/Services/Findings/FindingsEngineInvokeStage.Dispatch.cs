using System.Diagnostics;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

partial class FindingsEngineInvokeStage
{
    private void AppendEngineOutcome(FindingsStageContext context, EngineInvocationOutcome outcome)
    {
        EngineAdapter engine = outcome.Engine;

        if (outcome.Exception is not null)
        {
            Exception ex = outcome.Exception;
            LogEngineFailed(ex, context.RunId, engine.EngineType, engine.Category, outcome.DurationMs);
            ArchLucidInstrumentation.RecordFindingEngineFailure(engine.EngineType, engine.Category);
            context.EngineExceptions.Add(ex);
            context.EngineFailures.Add(
                new FindingEngineFailure
                {
                    EngineType = engine.EngineType,
                    Category = engine.Category,
                    ErrorMessage = ex.Message,
                    ExceptionType = ex.GetType().Name,
                    DurationMs = outcome.DurationMs,
                    OccurredUtc = _clock.UtcNowDateTime(),
                });

            return;
        }

        IReadOnlyList<Finding> findings = outcome.Findings ?? [];

        context.SuccessfulEngineInvocations++;
        context.SuccessfulEngineTypes.Add(engine.EngineType);
        LogEngineCompleted(context.RunId, engine.EngineType, engine.Category, outcome.DurationMs, findings.Count);

        foreach (Finding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.Category))
                finding.Category = engine.Category;

            if (string.IsNullOrWhiteSpace(finding.QualityDimension)
                && FindingEngineArchitecturePillarResolver.TryResolveStorageKey(
                    engine.Category,
                    out string pillarStorageKey))
            {
                finding.QualityDimension = pillarStorageKey;
            }

            if (!TryAcceptValidatedFinding(
                    _validator,
                    finding,
                    engine,
                    context.EngineFailures,
                    out string? rejectionReason))
            {
                LogFindingPayloadRejected(context.RunId, engine.EngineType, finding.FindingId, rejectionReason!);
                continue;
            }

            if (!string.Equals(finding.Category, engine.Category, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Finding category '{finding.Category}' did not match engine category '{engine.Category}' for engine '{engine.EngineType}'.");
            }

            context.AllFindings.Add(finding);
        }
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
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graphSnapshot, analysisContext, ct);
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
}
