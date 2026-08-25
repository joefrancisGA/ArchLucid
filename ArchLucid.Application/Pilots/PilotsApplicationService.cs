using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Default <see cref="IPilotsApplicationService"/> consolidating pilot route orchestration previously in
///     <c>PilotsController</c>.
/// </summary>
public sealed class PilotsApplicationService(
    FirstValueReportBuilder firstValueReportBuilder,
    ISponsorReviewPacketBuilder sponsorReviewPacketBuilder,
    FirstValueReportPdfBuilder firstValueReportPdfBuilder,
    PilotScorecardBuilder pilotScorecardBuilder,
    IPilotInProductScorecardService pilotInProductScorecardService,
    PilotOutcomeSummaryService pilotOutcomeSummaryService,
    RoiCostEvidenceCollectionResolver roiCostEvidenceCollectionResolver,
    IPilotReportCardService pilotReportCardService,
    SponsorOnePagerPdfBuilder sponsorOnePagerPdfBuilder,
    IWhyArchLucidSnapshotService whyArchLucidSnapshotService,
    ISponsorEvidencePackService sponsorEvidencePackService,
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    IRecentPilotRunDeltasService recentPilotRunDeltasService,
    IPilotCloseoutRepository pilotCloseoutRepository,
    IBuyerProofPackBuilder buyerProofPackBuilder,
    IAuditService auditService,
    ValueReportBuilder valueReportBuilder,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IPilotBaselineRepository pilotBaselineRepository) : IPilotsApplicationService
{
    private readonly FirstValueReportBuilder _firstValueReportBuilder =
        firstValueReportBuilder ?? throw new ArgumentNullException(nameof(firstValueReportBuilder));

    private readonly ISponsorReviewPacketBuilder _sponsorReviewPacketBuilder =
        sponsorReviewPacketBuilder ?? throw new ArgumentNullException(nameof(sponsorReviewPacketBuilder));

    private readonly FirstValueReportPdfBuilder _firstValueReportPdfBuilder =
        firstValueReportPdfBuilder ?? throw new ArgumentNullException(nameof(firstValueReportPdfBuilder));

    private readonly PilotScorecardBuilder _pilotScorecardBuilder =
        pilotScorecardBuilder ?? throw new ArgumentNullException(nameof(pilotScorecardBuilder));

    private readonly IPilotInProductScorecardService _pilotInProductScorecardService =
        pilotInProductScorecardService ?? throw new ArgumentNullException(nameof(pilotInProductScorecardService));

    private readonly PilotOutcomeSummaryService _pilotOutcomeSummaryService =
        pilotOutcomeSummaryService ?? throw new ArgumentNullException(nameof(pilotOutcomeSummaryService));

    private readonly RoiCostEvidenceCollectionResolver _roiCostEvidenceCollectionResolver =
        roiCostEvidenceCollectionResolver ?? throw new ArgumentNullException(nameof(roiCostEvidenceCollectionResolver));

    private readonly IPilotReportCardService _pilotReportCardService =
        pilotReportCardService ?? throw new ArgumentNullException(nameof(pilotReportCardService));

    private readonly SponsorOnePagerPdfBuilder _sponsorOnePagerPdfBuilder =
        sponsorOnePagerPdfBuilder ?? throw new ArgumentNullException(nameof(sponsorOnePagerPdfBuilder));

    private readonly IWhyArchLucidSnapshotService _whyArchLucidSnapshotService =
        whyArchLucidSnapshotService ?? throw new ArgumentNullException(nameof(whyArchLucidSnapshotService));

    private readonly ISponsorEvidencePackService _sponsorEvidencePackService =
        sponsorEvidencePackService ?? throw new ArgumentNullException(nameof(sponsorEvidencePackService));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer =
        pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));

    private readonly IRecentPilotRunDeltasService _recentPilotRunDeltasService =
        recentPilotRunDeltasService ?? throw new ArgumentNullException(nameof(recentPilotRunDeltasService));

    private readonly IPilotCloseoutRepository _pilotCloseoutRepository =
        pilotCloseoutRepository ?? throw new ArgumentNullException(nameof(pilotCloseoutRepository));

    private readonly IBuyerProofPackBuilder _buyerProofPackBuilder =
        buyerProofPackBuilder ?? throw new ArgumentNullException(nameof(buyerProofPackBuilder));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ValueReportBuilder _valueReportBuilder =
        valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IPilotBaselineRepository _pilotBaselineRepository =
        pilotBaselineRepository ?? throw new ArgumentNullException(nameof(pilotBaselineRepository));

    /// <inheritdoc />
    public Task<WhyArchLucidSnapshotResponse> GetWhyArchLucidSnapshotAsync(CancellationToken ct) =>
        _whyArchLucidSnapshotService.BuildAsync(ct);

    /// <inheritdoc />
    public Task<SponsorEvidencePackResponse> GetSponsorEvidencePackAsync(CancellationToken ct) =>
        _sponsorEvidencePackService.BuildAsync(ct);

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
    public Task<string?> TryBuildExecutiveReviewPacketMarkdownAsync(string runId, CancellationToken ct) =>
        _sponsorReviewPacketBuilder.BuildMarkdownAsync(runId, ct);

    /// <inheritdoc />
    public async Task<BuyerProofPackBuildResult?> TryBuildSponsorProofPackZipAsync(
        string runId,
        string baseForLinks,
        string correlationId,
        CancellationToken ct)
    {
        BuyerProofPackBuildResult? result =
            await _buyerProofPackBuilder.TryBuildZipAsync(runId, baseForLinks, ct);

        if (result is null)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SponsorProofPackGenerated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = JsonSerializer.Serialize(new { runId, demoDataWarning = result.DemoDataWarning }),
            },
            ct);

        return result;
    }

    /// <inheritdoc />
    public Task<string?> TryBuildFirstValueReportMarkdownAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct) =>
        _firstValueReportBuilder.BuildMarkdownAsync(runId, baseForLinks, ct);

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
    public Task<byte[]?> TryBuildFirstValueReportPdfAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct) =>
        _firstValueReportPdfBuilder.BuildPdfAsync(runId, baseForLinks, ct);

    /// <inheritdoc />
    public async Task<SponsorPackSentResult> RecordSponsorPackSentAsync(
        string runId,
        string? deliveryMethod,
        string? recipientEmail,
        string correlationId,
        CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return new SponsorPackSentResult(SponsorPackSentOutcome.RunNotFound);

        if (!detail.IsCommitted)
            return new SponsorPackSentResult(SponsorPackSentOutcome.NotCommitted);

        string normalizedDeliveryMethod = deliveryMethod?.Trim() ?? "email";

        if (normalizedDeliveryMethod.Length > 64)
            normalizedDeliveryMethod = normalizedDeliveryMethod[..64];

        string? normalizedRecipientEmail = recipientEmail?.Trim();

        if (normalizedRecipientEmail is not null && normalizedRecipientEmail.Length > 320)
            normalizedRecipientEmail = normalizedRecipientEmail[..320];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        string payload = JsonSerializer.Serialize(
            new
            {
                runId = detail.Run.RunId,
                recipientEmail = normalizedRecipientEmail,
                deliveryMethod = normalizedDeliveryMethod,
                recordedUtc = TimeProvider.System.GetUtcNow(),
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SponsorEvidencePackSent,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = payload,
            },
            ct);

        return new SponsorPackSentResult(SponsorPackSentOutcome.Recorded);
    }

    /// <inheritdoc />
    public async Task<SponsorPreliminaryShareResult> RecordSponsorPreliminaryShareAsync(
        string runId,
        string? readinessStatus,
        string[] knownGaps,
        bool? overrideAcknowledged,
        string? confidentialityLabel,
        string? deliveryMethod,
        string correlationId,
        CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return new SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome.RunNotFound);

        string normalizedReadinessStatus = readinessStatus?.Trim() ?? "unknown";

        if (normalizedReadinessStatus.Length > 64)
            normalizedReadinessStatus = normalizedReadinessStatus[..64];

        if (!string.Equals(normalizedReadinessStatus, "ready", StringComparison.OrdinalIgnoreCase)
            && overrideAcknowledged != true)
        {
            return new SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome.OverrideRequired);
        }

        string normalizedDeliveryMethod = deliveryMethod?.Trim() ?? "preliminary-draft";

        if (normalizedDeliveryMethod.Length > 64)
            normalizedDeliveryMethod = normalizedDeliveryMethod[..64];

        string? normalizedConfidentialityLabel = confidentialityLabel?.Trim();

        if (normalizedConfidentialityLabel is not null && normalizedConfidentialityLabel.Length > 256)
            normalizedConfidentialityLabel = normalizedConfidentialityLabel[..256];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        string payload = JsonSerializer.Serialize(
            new
            {
                runId = detail.Run.RunId,
                readinessStatus = normalizedReadinessStatus,
                knownGaps,
                overrideAcknowledged = overrideAcknowledged == true,
                confidentialityLabel = normalizedConfidentialityLabel,
                deliveryMethod = normalizedDeliveryMethod,
                isCommitted = detail.IsCommitted,
                recordedUtc = TimeProvider.System.GetUtcNow(),
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SponsorPreliminaryArchitectureShared,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = payload,
            },
            ct);

        return new SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome.Recorded);
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

    /// <inheritdoc />
    public Task<byte[]?> TryBuildSponsorOnePagerPdfAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct) =>
        _sponsorOnePagerPdfBuilder.BuildPdfAsync(runId, baseForLinks, ct);

    /// <inheritdoc />
    public async Task<PilotCloseoutCreateResult> CreateCloseoutAsync(
        string? runId,
        decimal? baselineHours,
        int speedScore,
        int manifestPackageScore,
        int traceabilityScore,
        string? notes,
        CancellationToken ct)
    {
        if (baselineHours is < 0)
            throw new ArgumentException("BaselineHours cannot be negative.");

        if (speedScore is < 1 or > 5 || manifestPackageScore is < 1 or > 5 || traceabilityScore is < 1 or > 5)
            throw new ArgumentException("Scores must be between 1 and 5.");

        Guid? runGuid = null;

        if (!string.IsNullOrWhiteSpace(runId))
        {
            if (!Guid.TryParse(runId, out Guid parsed))
                throw new ArgumentException("RunId must be a GUID string when supplied.");

            runGuid = parsed;
        }

        string? normalizedNotes = notes;

        if (normalizedNotes is not null && normalizedNotes.Length > 2000)
            normalizedNotes = normalizedNotes[..2000];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        Guid closeoutId = Guid.NewGuid();
        DateTimeOffset created = TimeProvider.System.GetUtcNow();

        PilotCloseoutRecord record = new()
        {
            CloseoutId = closeoutId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            BaselineHours = baselineHours,
            SpeedScore = (byte)speedScore,
            ManifestPackageScore = (byte)manifestPackageScore,
            TraceabilityScore = (byte)traceabilityScore,
            Notes = normalizedNotes,
            CreatedUtc = created,
        };

        await _pilotCloseoutRepository.InsertAsync(record, ct);

        string auditPayload = JsonSerializer.Serialize(
            new
            {
                closeoutId,
                runId = runGuid,
                baselineHours,
                speed = speedScore,
                manifestPackage = manifestPackageScore,
                traceability = traceabilityScore,
                notesLength = normalizedNotes?.Length ?? 0,
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PilotCloseoutRecorded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = auditPayload,
                CorrelationId = closeoutId.ToString(),
            },
            ct);

        return new PilotCloseoutCreateResult(closeoutId);
    }
}
