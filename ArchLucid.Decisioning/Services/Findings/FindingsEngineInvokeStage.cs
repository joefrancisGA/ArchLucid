using System.Diagnostics;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed partial class FindingsEngineInvokeStage(
    IEnumerable<IFindingEngine> engines,
    IFindingPayloadValidator validator,
    ILogger<FindingsEngineInvokeStage> logger,
    TimeProvider? timeProvider = null,
    IEnumerable<IEffectfulFindingEngine>? effectfulEngines = null,
    IPortfolioRecurrenceCurrentReviewIdentitySource? portfolioRecurrenceCurrentReviewIdentitySource = null)
    : IFindingsEngineInvokeStage
{
    private const string PortfolioRecurrenceEngineType = "portfolio-recurrence";

    private readonly IEnumerable<IFindingEngine> _engines =
        engines ?? throw new ArgumentNullException(nameof(engines));

    private readonly IFindingPayloadValidator _validator =
        validator ?? throw new ArgumentNullException(nameof(validator));

    private readonly ILogger<FindingsEngineInvokeStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    private readonly IEnumerable<IEffectfulFindingEngine>? _effectfulEngines = effectfulEngines;

    private readonly IPortfolioRecurrenceCurrentReviewIdentitySource? _portfolioRecurrenceCurrentReviewIdentitySource =
        portfolioRecurrenceCurrentReviewIdentitySource;

    public async Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        IReadOnlyList<EngineAdapter> allAdapters = EngineAdapter.FromEngines(_engines, _effectfulEngines);
        bool deferPortfolioRecurrence = _portfolioRecurrenceCurrentReviewIdentitySource is not null;
        EngineAdapter[] primaryAdapters = allAdapters
            .Where(adapter =>
                !deferPortfolioRecurrence
                || !string.Equals(adapter.EngineType, PortfolioRecurrenceEngineType, StringComparison.OrdinalIgnoreCase))
            .ToArray();
        EngineAdapter? portfolioRecurrenceAdapter = deferPortfolioRecurrence
            ? allAdapters.FirstOrDefault(adapter =>
                string.Equals(adapter.EngineType, PortfolioRecurrenceEngineType, StringComparison.OrdinalIgnoreCase))
            : null;

        Task<EngineInvocationOutcome>[] invocationTasks = primaryAdapters
            .Select(adapter => InvokeEngineAsync(adapter, context.GraphSnapshot, context.AnalysisContext, cancellationToken))
            .ToArray();

        EngineInvocationOutcome[] outcomes = await AwaitEngineInvocationsAsync(invocationTasks);
        EngineInvocationOutcome[] orderedOutcomes = outcomes
            .OrderBy(static outcome => outcome.Engine.EngineType, StringComparer.Ordinal)
            .ToArray();

        foreach (EngineInvocationOutcome outcome in orderedOutcomes)
        {
            AppendEngineOutcome(context, outcome);
        }

        if (portfolioRecurrenceAdapter is not null && _portfolioRecurrenceCurrentReviewIdentitySource is not null)
        {
            _portfolioRecurrenceCurrentReviewIdentitySource.SetIdentities(
                CollectPortfolioRecurrenceIdentities(context.AllFindings));

            EngineInvocationOutcome portfolioOutcome =
                await InvokeEngineAsync(
                    portfolioRecurrenceAdapter,
                    context.GraphSnapshot,
                    context.AnalysisContext,
                    cancellationToken);

            AppendEngineOutcome(context, portfolioOutcome);
        }

        if (context.SuccessfulEngineInvocations == 0 && context.EngineExceptions.Count > 0)
            throw new AggregateException("All finding engines failed for this snapshot.", context.EngineExceptions);
    }

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

    private static IReadOnlyCollection<string> CollectPortfolioRecurrenceIdentities(IEnumerable<Finding> findings)
    {
        HashSet<string> identities = new(StringComparer.Ordinal);

        foreach (Finding finding in findings)
        {
            if (finding.IsMuted)
                continue;

            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            identities.Add(FindingSnapshotMergeKey.FromFinding(finding));
        }

        return identities;
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
}
