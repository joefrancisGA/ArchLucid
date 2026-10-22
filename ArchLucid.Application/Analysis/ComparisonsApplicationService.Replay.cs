using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public sealed partial class ComparisonsApplicationService
{
    /// <inheritdoc />
    public async Task<ComparisonReplayCostEstimate?> TryEstimateReplayCostAsync(
        string comparisonRecordId,
        string? format,
        string? replayMode,
        bool persistReplay,
        CancellationToken ct)
    {
        if (await LoadScopedComparisonRecordAsync(comparisonRecordId, ct) is null)
            return null;

        return await _comparisonReplayCostEstimator.TryEstimateAsync(
            comparisonRecordId,
            format,
            replayMode,
            persistReplay,
            ct);
    }

    /// <inheritdoc />
    public async Task<ReplayComparisonResult?> TryReplaySummaryMarkdownAsync(
        string comparisonRecordId,
        CancellationToken ct)
    {
        ComparisonRecord? record = await LoadScopedComparisonRecordAsync(comparisonRecordId, ct);

        if (record is null)
            return null;

        if (!string.IsNullOrWhiteSpace(record.SummaryMarkdown))
        {
            return new ReplayComparisonResult
            {
                ComparisonRecordId = record.ComparisonRecordId,
                ComparisonType = record.ComparisonType,
                Format = "markdown",
                Content = record.SummaryMarkdown,
                FileName = $"comparison_{record.ComparisonRecordId}.md",
            };
        }

        return await _comparisonReplayService.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = comparisonRecordId,
                Format = "markdown",
                ReplayMode = "artifact",
                PersistReplay = false,
            },
            ct);
    }

    /// <inheritdoc />
    public async Task<ReplayComparisonResult?> TryReplayAsync(
        ReplayComparisonRequest request,
        CancellationToken ct)
    {
        if (await LoadScopedComparisonRecordAsync(request.ComparisonRecordId, ct) is null)
            return null;

        return await _comparisonReplayService.ReplayAsync(request, ct);
    }
}
