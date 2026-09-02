using System.Diagnostics;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
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
    IEnumerable<IEffectfulFindingEngine>? effectfulEngines = null,
    IScopeContextProvider? scopeContextProvider = null,
    IEffectiveGovernanceLoader? effectiveGovernanceLoader = null,
    IPortfolioRecurrenceCurrentReviewIdentitySource? portfolioRecurrenceCurrentReviewIdentitySource = null)
    : IFindingsOrchestrator
{
    private const string PortfolioRecurrenceEngineType = "portfolio-recurrence";

    private readonly IFindingPayloadValidator _validator =
        validator ?? throw new ArgumentNullException(nameof(validator));

    private readonly IOptions<HumanReviewFindingOptions> _humanReviewOptions =
        humanReviewOptions ?? throw new ArgumentNullException(nameof(humanReviewOptions));

    private readonly IInsightDensityGate _insightDensityGate =
        insightDensityGate ?? throw new ArgumentNullException(nameof(insightDensityGate));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    private readonly IScopeContextProvider? _scopeContextProvider = scopeContextProvider;

    private readonly IEffectiveGovernanceLoader? _effectiveGovernanceLoader = effectiveGovernanceLoader;

    private readonly IPortfolioRecurrenceCurrentReviewIdentitySource? _portfolioRecurrenceCurrentReviewIdentitySource =
        portfolioRecurrenceCurrentReviewIdentitySource;

    public async Task<FindingsSnapshot> GenerateFindingsSnapshotAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        CancellationToken ct,
        FindingAnalysisContext? analysisContext = null)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(engines);

        if (analysisContext is not null)
            FindingAnalysisContextGraphStamp.Stamp(graphSnapshot, analysisContext);

        await TryStampPolicyExpectationsAsync(graphSnapshot, runId, ct);

        List<Finding> allFindings = [];
        List<FindingEngineFailure> engineFailures = [];
        List<Exception> engineExceptions = [];
        int successfulEngineInvocations = 0;
        HashSet<string> successfulEngineTypes = new(StringComparer.OrdinalIgnoreCase);

        IReadOnlyList<EngineAdapter> allAdapters = EngineAdapter.FromEngines(engines, effectfulEngines);
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
            .Select(adapter => InvokeEngineAsync(adapter, graphSnapshot, analysisContext, ct))
            .ToArray();

        EngineInvocationOutcome[] outcomes = await AwaitEngineInvocationsAsync(invocationTasks);
        EngineInvocationOutcome[] orderedOutcomes = outcomes
            .OrderBy(static outcome => outcome.Engine.EngineType, StringComparer.Ordinal)
            .ToArray();

        foreach (EngineInvocationOutcome outcome in orderedOutcomes)
        {
            AppendEngineOutcome(
                runId,
                outcome,
                allFindings,
                engineFailures,
                engineExceptions,
                successfulEngineTypes,
                ref successfulEngineInvocations);
        }

        if (portfolioRecurrenceAdapter is not null && _portfolioRecurrenceCurrentReviewIdentitySource is not null)
        {
            _portfolioRecurrenceCurrentReviewIdentitySource.SetIdentities(
                CollectPortfolioRecurrenceIdentities(allFindings));

            EngineInvocationOutcome portfolioOutcome =
                await InvokeEngineAsync(portfolioRecurrenceAdapter, graphSnapshot, analysisContext, ct);

            AppendEngineOutcome(
                runId,
                portfolioOutcome,
                allFindings,
                engineFailures,
                engineExceptions,
                successfulEngineTypes,
                ref successfulEngineInvocations);
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
        dedupedFindings.AddRange(FindingMergeConflictPresenter.PresentAsFindings(mergeResult.Conflicts, _clock));

        if (analysisContext is not null)
        {
            IReadOnlyList<string> policyViolations = PolicyPackCategoryCoverageValidator.GetMissingCategoryViolations(
                analysisContext,
                dedupedFindings,
                successfulEngineTypes);

            foreach (string violation in policyViolations)
            {
                engineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "policy-pack-coverage",
                        Category = "Policy",
                        ErrorMessage = violation,
                        ExceptionType = nameof(PolicyPackCategoryCoverageValidator),
                        OccurredUtc = _clock.UtcNowDateTime(),
                    });
            }
        }

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

    private void AppendEngineOutcome(
        Guid runId,
        EngineInvocationOutcome outcome,
        List<Finding> allFindings,
        List<FindingEngineFailure> engineFailures,
        List<Exception> engineExceptions,
        ISet<string> successfulEngineTypes,
        ref int successfulEngineInvocations)
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

            return;
        }

        IReadOnlyList<Finding> findings = outcome.Findings ?? [];

        successfulEngineInvocations++;
        successfulEngineTypes.Add(engine.EngineType);
        LogEngineCompleted(runId, engine.EngineType, engine.Category, outcome.DurationMs, findings.Count);

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
                    engineFailures,
                    out string? rejectionReason))
            {
                LogFindingPayloadRejected(runId, engine.EngineType, finding.FindingId, rejectionReason!);
                continue;
            }

            if (!string.Equals(finding.Category, engine.Category, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Finding category '{finding.Category}' did not match engine category '{engine.Category}' for engine '{engine.EngineType}'.");
            }

            allFindings.Add(finding);
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

    private async Task TryStampPolicyExpectationsAsync(
        GraphSnapshot graphSnapshot,
        Guid runId,
        CancellationToken ct)
    {
        if (_scopeContextProvider is null || _effectiveGovernanceLoader is null)
            return;

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            ArchLucid.Contracts.Governance.PolicyPackContentDocument effective = await _effectiveGovernanceLoader
                .LoadEffectiveContentAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, ct);

            PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(effective);

            if (!facet.IsEmpty)
                PolicyExpectationGraphStamp.Stamp(graphSnapshot, facet);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            LogPolicyExpectationStampFailed(ex, runId);
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

    [LoggerMessage(
        EventId = 6,
        Level = LogLevel.Warning,
        Message = "Policy expectation stamp failed (fail-open): RunId={RunId}")]
    private partial void LogPolicyExpectationStampFailed(Exception ex, Guid runId);
}
