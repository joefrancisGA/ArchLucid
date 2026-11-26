using System.Diagnostics;
using System.Data.Common;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
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
            if (IsRequirementComparison(engine) && outcome.Attempts > 1)
            {
                context.RequirementComparisonRecovery = IsTransientReadError(ex)
                    ? RequirementComparisonRecoveryCodes.RetryExhausted
                    : RequirementComparisonRecoveryCodes.RetryStopped;
            }
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

        int acceptedBefore = context.AllFindings.Count;
        int failuresBefore = context.EngineFailures.Count;
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

        if (IsRequirementComparison(engine) && failuresBefore == context.EngineFailures.Count)
        {
            bool accepted = context.AllFindings.Count > acceptedBefore;
            context.RequirementComparisonRecovery = (outcome.Attempts > 1, accepted) switch
            {
                (true, true) => RequirementComparisonRecoveryCodes.RecoveredWithFindings,
                (true, false) => RequirementComparisonRecoveryCodes.RecoveredNoFindings,
                (false, true) => RequirementComparisonRecoveryCodes.WithFindings,
                _ => RequirementComparisonRecoveryCodes.NoFindings,
            };
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
        int maxAttempts = IsRequirementComparison(engine) ? 2 : 1;
        for (int attempt = 1; ; attempt++)
        {
            try
            {
                ct.ThrowIfCancellationRequested();
                IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graphSnapshot, analysisContext, ct);
                ct.ThrowIfCancellationRequested();
                return new EngineInvocationOutcome(engine, findings, null, sw.ElapsedMilliseconds, attempt);
            }
            catch (Exception ex) when (attempt < maxAttempts && IsTransientReadError(ex))
            {
                LogRequirementComparisonRetrying(contextRunId: graphSnapshot.RunId);
                await Task.Delay(TimeSpan.FromMilliseconds(100), _clock, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                return new EngineInvocationOutcome(engine, null, ex, sw.ElapsedMilliseconds, attempt);
            }
        }
    }

    private static bool IsRequirementComparison(EngineAdapter engine) =>
        string.Equals(engine.EngineType, RequirementComparisonRecoveryCodes.EngineType, StringComparison.OrdinalIgnoreCase)
        && string.Equals(engine.Category, "Requirement", StringComparison.OrdinalIgnoreCase);

    private static bool IsTransientReadError(Exception error) =>
        error is TimeoutException or DbException { IsTransient: true };

    private sealed record EngineInvocationOutcome(
        EngineAdapter Engine,
        IReadOnlyList<Finding>? Findings,
        Exception? Exception,
        long DurationMs,
        int Attempts);

    [LoggerMessage(EventId = 6, Level = LogLevel.Information,
        Message = "Requirement comparison retrying a transient read in run {ContextRunId}.")]
    private partial void LogRequirementComparisonRetrying(Guid contextRunId);

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
