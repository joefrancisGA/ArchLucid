using ArchLucid.Application.Analysis.ComparisonBatchReplay;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public sealed partial class ComparisonsApplicationService
{
    /// <inheritdoc />
    public async Task<DriftAnalysisResult?> TryAnalyzeDriftAsync(string comparisonRecordId, CancellationToken ct)
    {
        if (await LoadScopedComparisonRecordAsync(comparisonRecordId, ct) is null)
            return null;

        return await _comparisonReplayService.AnalyzeDriftAsync(comparisonRecordId, ct);
    }

    /// <inheritdoc />
    public DriftReportContent? TryBuildDriftReportContent(
        DriftAnalysisResult drift,
        string comparisonRecordId,
        string format)
    {
        string normalizedFormat = format.Trim().ToLowerInvariant();

        return normalizedFormat switch
        {
            "markdown" => new DriftReportContent
            {
                Payload = [],
                TextPayload = _driftReportFormatter.FormatMarkdown(drift, comparisonRecordId),
                ContentType = "text/markdown",
                FileName = $"drift-report_{comparisonRecordId}.md",
                IsText = true,
            },
            "html" => new DriftReportContent
            {
                Payload = [],
                TextPayload = _driftReportFormatter.FormatHtml(drift, comparisonRecordId),
                ContentType = "text/html",
                FileName = $"drift-report_{comparisonRecordId}.html",
                IsText = true,
            },
            "docx" => new DriftReportContent
            {
                Payload = _driftReportDocxExport.GenerateDocx(drift, comparisonRecordId),
                ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                FileName = $"drift-report_{comparisonRecordId}.docx",
                IsText = false,
            },
            _ => null,
        };
    }

    /// <inheritdoc />
    public async Task<ComparisonBatchReplayZipResult?> TryBuildBatchReplayZipAsync(
        IReadOnlyList<string> comparisonRecordIds,
        string? format,
        string? replayMode,
        string? profile,
        bool persistReplay,
        CancellationToken ct)
    {
        List<string> processedIds = [];
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);

        foreach (string id in comparisonRecordIds)
        {
            if (seen.Add(id))
                processedIds.Add(id);
        }

        List<(string Id, ReplayComparisonResult Result)> successes = [];
        List<ComparisonBatchReplayManifestFailureEntry> failed = [];

        foreach (string id in processedIds)
        {
            try
            {
                if (await LoadScopedComparisonRecordAsync(id, ct) is null)
                {
                    failed.Add(
                        new ComparisonBatchReplayManifestFailureEntry
                        {
                            ComparisonRecordId = id,
                            Reason = $"Comparison record '{id}' was not found.",
                            ExceptionType = nameof(InvalidOperationException),
                        });

                    continue;
                }

                ReplayComparisonResult result = await _comparisonReplayService.ReplayAsync(
                    new ReplayComparisonRequest
                    {
                        ComparisonRecordId = id,
                        Format = format ?? "markdown",
                        ReplayMode = replayMode ?? "artifact",
                        Profile = profile,
                        PersistReplay = persistReplay,
                    },
                    ct);

                successes.Add((id, result));
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                failed.Add(
                    new ComparisonBatchReplayManifestFailureEntry
                    {
                        ComparisonRecordId = id,
                        Reason = ex.Message,
                        ExceptionType = ex.GetType().Name,
                    });
            }
        }

        if (successes.Count == 0 && processedIds.Count > 0)
            return null;

        return await ComparisonBatchReplayZipSupport.BuildZipAsync(successes, processedIds, failed, ct);
    }
}
