using System.Text.Json;

using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Application.Pilots;

public sealed partial class PilotsApplicationService
{
    /// <inheritdoc />
    public Task<PilotInProductScorecardResult> GetInProductScorecardAsync(CancellationToken ct) =>
        _pilotInProductScorecardService.GetAsync(ct);

    /// <inheritdoc />
    public async Task UpsertScorecardBaselinesAsync(
        decimal? baselineHoursPerReview,
        int? baselineReviewsPerQuarter,
        decimal? baselineArchitectHourlyCost,
        string correlationId,
        CancellationToken ct)
    {
        await _pilotInProductScorecardService.UpsertBaselinesAsync(
            baselineHoursPerReview,
            baselineReviewsPerQuarter,
            baselineArchitectHourlyCost,
            ct);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        string payload = JsonSerializer.Serialize(
            new
            {
                baselineHoursPerReview,
                baselineReviewsPerQuarter,
                baselineArchitectHourlyCost,
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PilotScorecardBaselinesUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = payload,
                CorrelationId = correlationId,
            },
            ct);
    }

    /// <inheritdoc />
    public Task<PilotScorecardSummary> GetOutcomeSummaryAsync(CancellationToken ct) =>
        _pilotOutcomeSummaryService.GetTrailing30DaysAsync(ct);

    /// <inheritdoc />
    public async Task<PilotReportCard> GetReportCardAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _pilotReportCardService.GenerateReportCardAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public async Task<PilotRunDeltasResponse?> TryGetPilotRunDeltasAsync(string runId, CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return null;

        PilotRunDeltas deltas = await _pilotRunDeltaComputer.ComputeAsync(detail, ct);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        ValueReportSnapshot snapshot = await _valueReportBuilder.BuildAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            start,
            end,
            ct);

        DateTime? extractorCollectionTimestampUtc =
            await _roiCostEvidenceCollectionResolver.TryResolveLatestCollectionTimestampUtcAsync(
                scope,
                detail.Run.RunId,
                ct);

        PilotBaselineRecord? scorecardBaselines =
            await _pilotBaselineRepository.GetAsync(scope.TenantId, ct).ConfigureAwait(false);

        return PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            detail.Run,
            detail.Manifest,
            deltas,
            snapshot,
            extractorCollectionTimestampUtc,
            scorecardBaselines);
    }

    /// <inheritdoc />
    public async Task<RecentPilotRunDeltasResponse> GetRecentDeltasAsync(int? count, CancellationToken ct)
    {
        int requested = count ?? IRecentPilotRunDeltasService.DefaultCount;

        return await _recentPilotRunDeltasService.GetRecentDeltasAsync(requested, ct);
    }

    /// <inheritdoc />
    public async Task<PilotScorecardSummary> BuildScorecardAsync(
        DateTimeOffset? periodStart,
        DateTimeOffset? periodEnd,
        PilotScorecardValueMetricsSubmission? valueMetrics,
        string correlationId,
        CancellationToken ct)
    {
        DateTimeOffset end = periodEnd ?? TimeProvider.System.GetUtcNow();
        DateTimeOffset start = periodStart ?? end.AddDays(-30);

        if (end <= start)
            throw new ArgumentException("PeriodEnd must be after PeriodStart.");

        PilotScorecardSummary summary = await _pilotScorecardBuilder.BuildAsync(start, end, ct);

        if (valueMetrics is not null
            && (valueMetrics.HoursSaved.HasValue
                || valueMetrics.RisksMitigated.HasValue
                || !string.IsNullOrWhiteSpace(valueMetrics.QualitativeNotes)))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            string actor = _actorContext.GetActor();
            string payload = JsonSerializer.Serialize(
                new
                {
                    hoursSaved = valueMetrics.HoursSaved,
                    risksMitigated = valueMetrics.RisksMitigated,
                    qualitativeNotes = valueMetrics.QualitativeNotes,
                    periodStart = start,
                    periodEnd = end,
                });

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.PilotScorecardValueMetricsSubmitted,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = payload,
                    CorrelationId = correlationId,
                },
                ct);
        }

        return summary;
    }
}
