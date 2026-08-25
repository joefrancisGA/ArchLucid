using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Application workflow facade for pilot-facing HTTP routes: scorecards, sponsor packets, and closeout recording.
/// </summary>
public interface IPilotsApplicationService
{
    Task<WhyArchLucidSnapshotResponse> GetWhyArchLucidSnapshotAsync(CancellationToken ct);

    Task<SponsorEvidencePackResponse> GetSponsorEvidencePackAsync(CancellationToken ct);

    Task<PilotInProductScorecardResult> GetInProductScorecardAsync(CancellationToken ct);

    Task UpsertScorecardBaselinesAsync(
        decimal? baselineHoursPerReview,
        int? baselineReviewsPerQuarter,
        decimal? baselineArchitectHourlyCost,
        string correlationId,
        CancellationToken ct);

    Task<PilotScorecardSummary> GetOutcomeSummaryAsync(CancellationToken ct);

    Task<PilotReportCard> GetReportCardAsync(CancellationToken ct);

    Task<string?> TryBuildExecutiveReviewPacketMarkdownAsync(string runId, CancellationToken ct);

    Task<BuyerProofPackBuildResult?> TryBuildSponsorProofPackZipAsync(
        string runId,
        string baseForLinks,
        string correlationId,
        CancellationToken ct);

    Task<string?> TryBuildFirstValueReportMarkdownAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct);

    Task<PilotRunDeltasResponse?> TryGetPilotRunDeltasAsync(string runId, CancellationToken ct);

    Task<RecentPilotRunDeltasResponse> GetRecentDeltasAsync(int? count, CancellationToken ct);

    Task<byte[]?> TryBuildFirstValueReportPdfAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct);

    Task<SponsorPackSentResult> RecordSponsorPackSentAsync(
        string runId,
        string? deliveryMethod,
        string? recipientEmail,
        string correlationId,
        CancellationToken ct);

    Task<SponsorPreliminaryShareResult> RecordSponsorPreliminaryShareAsync(
        string runId,
        string? readinessStatus,
        string[] knownGaps,
        bool? overrideAcknowledged,
        string? confidentialityLabel,
        string? deliveryMethod,
        string correlationId,
        CancellationToken ct);

    Task<PilotScorecardSummary> BuildScorecardAsync(
        DateTimeOffset? periodStart,
        DateTimeOffset? periodEnd,
        PilotScorecardValueMetricsSubmission? valueMetrics,
        string correlationId,
        CancellationToken ct);

    Task<byte[]?> TryBuildSponsorOnePagerPdfAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct);

    Task<PilotCloseoutCreateResult> CreateCloseoutAsync(
        string? runId,
        decimal? baselineHours,
        int speedScore,
        int manifestPackageScore,
        int traceabilityScore,
        string? notes,
        CancellationToken ct);
}
