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
        ComparisonRecord? record = await LoadScopedComparisonRecordAsync(comparisonRecordId, ct);

        if (record is null)
            return null;

        await _comparisonReplayService.EnsureArtifactReplayAccessAllowedAsync(record, ct);

        return await _comparisonReplayCostEstimator.TryEstimateAsync(
            record.ComparisonRecordId,
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

        await _comparisonReplayService.EnsureArtifactReplayAccessAllowedAsync(record, ct);

        if (!string.IsNullOrWhiteSpace(record.SummaryMarkdown))
        {
            string normalizedComparisonRecordId = ComparisonRecordIdNormalizer.NormalizeRequired(record.ComparisonRecordId);

            return new ReplayComparisonResult
            {
                ComparisonRecordId = normalizedComparisonRecordId,
                ComparisonType = record.ComparisonType,
                Format = "markdown",
                Content = record.SummaryMarkdown,
                FileName = $"comparison_{normalizedComparisonRecordId}.md",
            };
        }

        return await _comparisonReplayService.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = record.ComparisonRecordId,
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
        string normalizedComparisonRecordId =
            ComparisonRecordIdNormalizer.NormalizeRequired(request.ComparisonRecordId);

        if (await LoadScopedComparisonRecordAsync(normalizedComparisonRecordId, ct) is null)
            return null;

        if (!string.Equals(
                normalizedComparisonRecordId,
                request.ComparisonRecordId,
                StringComparison.Ordinal))
        {
            request = new ReplayComparisonRequest
            {
                ComparisonRecordId = normalizedComparisonRecordId,
                Format = request.Format,
                ReplayMode = request.ReplayMode,
                PersistReplay = request.PersistReplay,
                Profile = request.Profile,
            };
        }

        return await _comparisonReplayService.ReplayAsync(request, ct);
    }
}
