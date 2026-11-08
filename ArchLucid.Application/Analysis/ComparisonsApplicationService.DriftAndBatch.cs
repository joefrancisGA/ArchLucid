using ArchLucid.Application.Analysis.ComparisonBatchReplay;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public sealed partial class ComparisonsApplicationService
{
    /// <inheritdoc />
    public async Task<DriftAnalysisResult?> TryAnalyzeDriftAsync(string comparisonRecordId, CancellationToken ct)
    {
        string normalizedComparisonRecordId =
            ComparisonRecordIdNormalizer.NormalizeRequired(comparisonRecordId);

        if (await LoadScopedComparisonRecordAsync(normalizedComparisonRecordId, ct) is null)
            return null;

        return await _comparisonReplayService.AnalyzeDriftAsync(normalizedComparisonRecordId, ct);
    }

    /// <inheritdoc />
    public DriftReportContent? TryBuildDriftReportContent(
        DriftAnalysisResult drift,
        string comparisonRecordId,
        string format)
    {
        string normalizedComparisonRecordId = ComparisonRecordIdNormalizer.NormalizeRequired(comparisonRecordId);
        string normalizedFormat = format.Trim().ToLowerInvariant();

        return normalizedFormat switch
        {
            "markdown" => new DriftReportContent
            {
                Payload = [],
                TextPayload = _driftReportFormatter.FormatMarkdown(drift, normalizedComparisonRecordId),
                ContentType = "text/markdown",
                FileName = $"drift-report_{normalizedComparisonRecordId}.md",
                IsText = true,
            },
            "html" => new DriftReportContent
            {
                Payload = [],
                TextPayload = _driftReportFormatter.FormatHtml(drift, normalizedComparisonRecordId),
                ContentType = "text/html",
                FileName = $"drift-report_{normalizedComparisonRecordId}.html",
                IsText = true,
            },
            "docx" => new DriftReportContent
            {
                Payload = _driftReportDocxExport.GenerateDocx(drift, normalizedComparisonRecordId),
                ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                FileName = $"drift-report_{normalizedComparisonRecordId}.docx",
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
            if (string.IsNullOrWhiteSpace(id))
            {
                if (seen.Add(id))
                    processedIds.Add(id);

                continue;
            }

            string normalizedId = ComparisonRecordIdNormalizer.NormalizeRequired(id);
            if (seen.Add(normalizedId))
                processedIds.Add(normalizedId);
        }

        List<(string Id, ReplayComparisonResult Result)> successes = [];
        List<ComparisonBatchReplayManifestFailureEntry> failed = [];

        foreach (string id in processedIds)
        {
            try
            {
                ComparisonRecord? scopedRecord = await LoadScopedComparisonRecordAsync(id, ct);

                if (scopedRecord is null)
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

                await ComparisonBatchReplayPinInventoryGuard.EnsureEndToEndReplayPairReadyOrThrowAsync(
                    scopedRecord,
                    replayMode,
                    _compareRunsFacade,
                    ct);

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
            catch (ConflictException)
            {
                throw;
            }
            catch (CareerArtifactExportBlockedException)
            {
                throw;
            }
            catch (ComparisonVerificationFailedException)
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
