using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Application workflow facade for comparison HTTP routes: history reads, replay, drift analysis, and batch export.
/// </summary>
public interface IComparisonsApplicationService
{
    Task<IReadOnlyList<ComparisonRecord>?> TryListByRunIdAsync(string runId, CancellationToken ct);

    Task<IReadOnlyList<ComparisonRecord>?> TryListByExportRecordIdAsync(
        string exportRecordId,
        CancellationToken ct);

    Task<ComparisonRecord?> TryGetScopedRecordAsync(string comparisonRecordId, CancellationToken ct);

    Task<ComparisonReplayCostEstimate?> TryEstimateReplayCostAsync(
        string comparisonRecordId,
        string? format,
        string? replayMode,
        bool persistReplay,
        CancellationToken ct);

    Task<ReplayComparisonResult?> TryReplaySummaryMarkdownAsync(
        string comparisonRecordId,
        CancellationToken ct);

    Task<ComparisonHistorySearchResult> SearchAsync(
        ComparisonHistorySearchCriteria criteria,
        CancellationToken ct);

    Task<ComparisonRecord?> TryUpdateLabelAndTagsAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken ct);

    Task<ReplayComparisonResult?> TryReplayAsync(
        ReplayComparisonRequest request,
        CancellationToken ct);

    Task<DriftAnalysisResult?> TryAnalyzeDriftAsync(string comparisonRecordId, CancellationToken ct);

    DriftReportContent? TryBuildDriftReportContent(
        DriftAnalysisResult drift,
        string comparisonRecordId,
        string format);

    Task<ComparisonBatchReplay.ComparisonBatchReplayZipResult?> TryBuildBatchReplayZipAsync(
        IReadOnlyList<string> comparisonRecordIds,
        string? format,
        string? replayMode,
        string? profile,
        bool persistReplay,
        CancellationToken ct);
}

/// <summary>Drift report artifact bytes and content type for HTTP file responses.</summary>
public sealed class DriftReportContent
{
    public required byte[] Payload
    {
        get;
        init;
    }

    public required string ContentType
    {
        get;
        init;
    }

    public required string FileName
    {
        get;
        init;
    }

    public bool IsText
    {
        get;
        init;
    }

    public string? TextPayload
    {
        get;
        init;
    }
}
