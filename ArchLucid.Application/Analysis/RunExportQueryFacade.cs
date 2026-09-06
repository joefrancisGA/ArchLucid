using System.Text.Json;

using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Analysis;

public sealed class RunExportQueryFacade(
    IRunDetailQueryService runDetailQueryService,
    IRunExportRecordRepository runExportRecordRepository,
    IComparisonAuditService comparisonAuditService,
    IExportReplayService exportReplayService,
    IExportRecordDiffService exportRecordDiffService,
    IExportRecordDiffSummaryFormatter exportRecordDiffSummaryFormatter,
    IAuditService auditService,
    IRunExportLineageVerifier runExportLineageVerifier,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IScopeContextProvider scopeContextProvider) : IRunExportQueryFacade
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));
    private readonly IRunExportRecordRepository _runExportRecordRepository = runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));
    private readonly IComparisonAuditService _comparisonAuditService = comparisonAuditService ?? throw new ArgumentNullException(nameof(comparisonAuditService));
    private readonly IExportReplayService _exportReplayService = exportReplayService ?? throw new ArgumentNullException(nameof(exportReplayService));
    private readonly IExportRecordDiffService _exportRecordDiffService = exportRecordDiffService ?? throw new ArgumentNullException(nameof(exportRecordDiffService));
    private readonly IExportRecordDiffSummaryFormatter _exportRecordDiffSummaryFormatter = exportRecordDiffSummaryFormatter ?? throw new ArgumentNullException(nameof(exportRecordDiffSummaryFormatter));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IRunExportLineageVerifier _runExportLineageVerifier =
        runExportLineageVerifier ?? throw new ArgumentNullException(nameof(runExportLineageVerifier));
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));
    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<RunExportHistoryQueryResult> GetRunExportHistoryAsync(string runId, CancellationToken cancellationToken = default)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out _))
            return new RunExportHistoryQueryResult { Outcome = ExportRecordLoadOutcome.RunNotFound, MissingRunId = runId };

        if (await _runDetailQueryService.GetRunDetailAsync(runId, cancellationToken) is null)
            return new RunExportHistoryQueryResult { Outcome = ExportRecordLoadOutcome.RunNotFound, MissingRunId = runId };

        if (Guid.TryParse(runId, out Guid runGuid))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            RunExportLineageVerificationResult? lineage =
                await _runExportLineageVerifier.VerifyAsync(scope, runGuid, cancellationToken);

            if (lineage is not null && lineage.Status != RunExportLineageVerificationStatus.Match)
            {
                return new RunExportHistoryQueryResult
                {
                    Outcome = ExportRecordLoadOutcome.LineageUnverified,
                    MissingRunId = runId,
                };
            }
        }

        IReadOnlyList<RunExportRecord> records = await _runExportRecordRepository.GetByRunIdAsync(runId, cancellationToken);
        return new RunExportHistoryQueryResult { Outcome = ExportRecordLoadOutcome.Success, Exports = records.ToList() };
    }

    public async Task<ScopedExportRecordLoadResult> GetExportRecordAsync(string exportRecordId, CancellationToken cancellationToken = default)
    {
        RunExportRecord? record = await LoadScopedExportRecordAsync(exportRecordId, cancellationToken);

        if (record is null)
        {
            return new ScopedExportRecordLoadResult
            {
                Outcome = ExportRecordLoadOutcome.ExportRecordNotFound,
                MissingId = exportRecordId,
            };
        }

        ExportRecordLoadOutcome? guardOutcome =
            await TryEnsureExportRunLineageAndSealedHashAsync(record.RunId, cancellationToken);

        if (guardOutcome is not null)
        {
            return new ScopedExportRecordLoadResult
            {
                Outcome = guardOutcome.Value,
                MissingId = record.RunId,
            };
        }

        return new ScopedExportRecordLoadResult { Outcome = ExportRecordLoadOutcome.Success, Record = record };
    }

    public async Task<ExportRecordDiffQueryResult> CompareExportRecordsAsync(string leftExportRecordId, string rightExportRecordId, CancellationToken cancellationToken = default)
    {
        (ExportRecordLoadOutcome outcome, RunExportRecord? left, RunExportRecord? right, string? missingId) =
            await LoadPairAsync(leftExportRecordId, rightExportRecordId, cancellationToken);
        if (outcome is not ExportRecordLoadOutcome.Success)
            return new ExportRecordDiffQueryResult { Outcome = outcome, MissingId = missingId };

        ExportRecordLoadOutcome? leftGuard =
            await TryEnsureExportRunLineageAndSealedHashAsync(left!.RunId, cancellationToken);

        if (leftGuard is not null)
            return new ExportRecordDiffQueryResult { Outcome = leftGuard.Value, MissingId = left.RunId };

        ExportRecordLoadOutcome? rightGuard =
            await TryEnsureExportRunLineageAndSealedHashAsync(right!.RunId, cancellationToken);

        if (rightGuard is not null)
            return new ExportRecordDiffQueryResult { Outcome = rightGuard.Value, MissingId = right.RunId };

        ExportRecordLoadOutcome? leftLifecycle =
            await TryEnsureExportRunLifecycleCompleteAsync(left!.RunId, cancellationToken);

        if (leftLifecycle is not null)
            return new ExportRecordDiffQueryResult { Outcome = leftLifecycle.Value, MissingId = left.RunId };

        ExportRecordLoadOutcome? rightLifecycle =
            await TryEnsureExportRunLifecycleCompleteAsync(right!.RunId, cancellationToken);

        if (rightLifecycle is not null)
            return new ExportRecordDiffQueryResult { Outcome = rightLifecycle.Value, MissingId = right.RunId };

        ExportRecordDiffResult diff = await _exportRecordDiffService.CompareAsync(left!, right!, cancellationToken);
        return new ExportRecordDiffQueryResult { Outcome = ExportRecordLoadOutcome.Success, Diff = diff };
    }

    public async Task<ExportRecordDiffSummaryQueryResult> CompareExportRecordsSummaryAsync(string leftExportRecordId, string rightExportRecordId, bool persist, CancellationToken cancellationToken = default)
    {
        (ExportRecordLoadOutcome outcome, RunExportRecord? left, RunExportRecord? right, string? missingId) =
            await LoadPairAsync(leftExportRecordId, rightExportRecordId, cancellationToken);
        if (outcome is not ExportRecordLoadOutcome.Success)
            return new ExportRecordDiffSummaryQueryResult { Outcome = outcome, MissingId = missingId };

        ExportRecordLoadOutcome? leftGuard =
            await TryEnsureExportRunLineageAndSealedHashAsync(left!.RunId, cancellationToken);

        if (leftGuard is not null)
            return new ExportRecordDiffSummaryQueryResult { Outcome = leftGuard.Value, MissingId = left.RunId };

        ExportRecordLoadOutcome? rightGuard =
            await TryEnsureExportRunLineageAndSealedHashAsync(right!.RunId, cancellationToken);

        if (rightGuard is not null)
            return new ExportRecordDiffSummaryQueryResult { Outcome = rightGuard.Value, MissingId = right.RunId };

        ExportRecordLoadOutcome? leftLifecycle =
            await TryEnsureExportRunLifecycleCompleteAsync(left!.RunId, cancellationToken);

        if (leftLifecycle is not null)
            return new ExportRecordDiffSummaryQueryResult { Outcome = leftLifecycle.Value, MissingId = left.RunId };

        ExportRecordLoadOutcome? rightLifecycle =
            await TryEnsureExportRunLifecycleCompleteAsync(right!.RunId, cancellationToken);

        if (rightLifecycle is not null)
            return new ExportRecordDiffSummaryQueryResult { Outcome = rightLifecycle.Value, MissingId = right.RunId };

        ExportRecordDiffResult diff = await _exportRecordDiffService.CompareAsync(left!, right!, cancellationToken);
        string summary = _exportRecordDiffSummaryFormatter.FormatMarkdown(diff);
        if (!persist)
            return new ExportRecordDiffSummaryQueryResult { Outcome = ExportRecordLoadOutcome.Success, SummaryMarkdown = summary };

        string comparisonRecordId = await _comparisonAuditService.RecordExportDiffAsync(diff, summary, cancellationToken);
        await _auditService.LogAsync(new AuditEvent
        {
            EventType = AuditEventTypes.ComparisonSummaryPersisted,
            DataJson = JsonSerializer.Serialize(new { comparisonId = comparisonRecordId, sourceExportRecordId = leftExportRecordId, leftExportRecordId, rightExportRecordId }, AuditJsonSerializationOptions.Instance),
        }, cancellationToken);
        return new ExportRecordDiffSummaryQueryResult { Outcome = ExportRecordLoadOutcome.Success, SummaryMarkdown = summary, ComparisonRecordId = comparisonRecordId };
    }

    public async Task<ExportReplayQueryResult> ReplayExportAsync(string exportRecordId, ReplayExportRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        RunExportRecord? record = await LoadScopedExportRecordAsync(exportRecordId, cancellationToken);

        if (record is null)
            return new ExportReplayQueryResult { Outcome = ExportRecordLoadOutcome.ExportRecordNotFound, MissingId = exportRecordId };

        ExportRecordLoadOutcome? guardOutcome =
            await TryEnsureExportRunLineageAndSealedHashAsync(record.RunId, cancellationToken);

        if (guardOutcome is not null)
            return new ExportReplayQueryResult { Outcome = guardOutcome.Value, MissingId = record.RunId };

        ReplayExportResult result = await _exportReplayService.ReplayAsync(request, cancellationToken);
        if (request.RecordReplayExport && !string.IsNullOrWhiteSpace(result.RecordedReplayExportRecordId))
        {
            Guid? auditRunId = Guid.TryParse(result.RunId, out Guid parsedRunId) ? parsedRunId : null;
            await _auditService.LogAsync(new AuditEvent
            {
                EventType = AuditEventTypes.ReplayExportRecorded,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new { sourceExportRecordId = result.ExportRecordId, recordedReplayExportRecordId = result.RecordedReplayExportRecordId, runId = result.RunId }, AuditJsonSerializationOptions.Instance),
            }, cancellationToken);
        }
        return new ExportReplayQueryResult { Outcome = ExportRecordLoadOutcome.Success, Replay = result };
    }

    private async Task<(ExportRecordLoadOutcome Outcome, RunExportRecord? Left, RunExportRecord? Right, string? MissingId)> LoadPairAsync(
        string leftExportRecordId, string rightExportRecordId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(leftExportRecordId))
            return (ExportRecordLoadOutcome.LeftIdRequired, null, null, null);
        if (string.IsNullOrWhiteSpace(rightExportRecordId))
            return (ExportRecordLoadOutcome.RightIdRequired, null, null, null);
        RunExportRecord? left = await LoadScopedExportRecordAsync(leftExportRecordId, cancellationToken);
        if (left is null)
            return (ExportRecordLoadOutcome.LeftNotFound, null, null, leftExportRecordId);
        RunExportRecord? right = await LoadScopedExportRecordAsync(rightExportRecordId, cancellationToken);
        return right is null
            ? (ExportRecordLoadOutcome.RightNotFound, left, null, rightExportRecordId)
            : (ExportRecordLoadOutcome.Success, left, right, null);
    }

    private async Task<RunExportRecord?> LoadScopedExportRecordAsync(string exportRecordId, CancellationToken cancellationToken)
    {
        RunExportRecord? record = await _runExportRecordRepository.GetByIdAsync(exportRecordId, cancellationToken);
        if (record is null)
            return null;
        return await _runDetailQueryService.GetRunDetailAsync(record.RunId, cancellationToken) is null ? null : record;
    }

    private async Task<ExportRecordLoadOutcome?> TryEnsureExportRunLineageAndSealedHashAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunExportLineageVerificationResult? lineage =
            await _runExportLineageVerifier.VerifyAsync(scope, runGuid, cancellationToken);

        if (lineage is not null && lineage.Status != RunExportLineageVerificationStatus.Match)
            return ExportRecordLoadOutcome.LineageUnverified;

        try
        {
            await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException)
        {
            return ExportRecordLoadOutcome.LineageUnverified;
        }

        return null;
    }

    private async Task<ExportRecordLoadOutcome?> TryEnsureExportRunLifecycleCompleteAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? runDetail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

        if (runDetail is null)
            return null;

        try
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
                AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(runDetail.Run),
                runId);
        }
        catch (ConflictException)
        {
            return ExportRecordLoadOutcome.LineageUnverified;
        }

        return null;
    }
}
