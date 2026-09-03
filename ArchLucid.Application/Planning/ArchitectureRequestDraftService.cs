using System.Diagnostics;

using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Application.Planning.Stages;
using ArchLucid.Contracts.Requests;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Planning;

public sealed class ArchitectureRequestDraftService(
    IArchitectureRequestDraftExtractStage extractStage,
    IArchitectureRequestDraftNormalizeStage normalizeStage,
    ILogger<ArchitectureRequestDraftService> logger) : IArchitectureRequestDraftService
{
    private const int SlowDraftWarningThresholdMs = 45_000;

    private static readonly EventId DraftCompletedEvent = new(20_401, "ArchitectureRequestDraft.Completed");
    private static readonly EventId DraftSlowEvent = new(20_402, "ArchitectureRequestDraft.Slow");

    private readonly IArchitectureRequestDraftExtractStage _extractStage =
        extractStage ?? throw new ArgumentNullException(nameof(extractStage));

    private readonly IArchitectureRequestDraftNormalizeStage _normalizeStage =
        normalizeStage ?? throw new ArgumentNullException(nameof(normalizeStage));

    private readonly ILogger<ArchitectureRequestDraftService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<DraftArchitectureRequestResponse> DraftAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken,
        IArchitectureRequestDraftProgress? progress = null)
    {
        ArgumentNullException.ThrowIfNull(input);

        long totalStartTicks = Stopwatch.GetTimestamp();
        int overviewLength = input.FreeTextDescription.Trim().Length;

        ArchitectureRequestDraftExtractionResult extraction =
            await _extractStage.ExtractAsync(input, progress, cancellationToken);

        long postProcessStartTicks = Stopwatch.GetTimestamp();

        DraftArchitectureRequestResponse response = await _normalizeStage.NormalizeAsync(
            input,
            extraction,
            progress,
            cancellationToken);

        double postProcessMs = Stopwatch.GetElapsedTime(postProcessStartTicks).TotalMilliseconds;
        double totalMs = Stopwatch.GetElapsedTime(totalStartTicks).TotalMilliseconds;

        LogDraftTiming(
            overviewLength,
            extraction.ExtractionMs,
            postProcessMs,
            totalMs,
            response.SuggestedConstraints.Length,
            response.SuggestedAssumptions.Length,
            response.SuggestedCapabilities.Length);

        return response;
    }

    internal static string BuildDraftUserPrompt(DraftArchitectureRequestInput input) =>
        ArchitectureRequestDraftExtractStage.BuildDraftUserPrompt(input);

    private void LogDraftTiming(
        int overviewLength,
        double extractionMs,
        double postProcessMs,
        double totalMs,
        int constraintCount,
        int assumptionCount,
        int capabilityCount)
    {
        if (!_logger.IsEnabled(LogLevel.Information))
            return;

        _logger.LogInformation(
            DraftCompletedEvent,
            "Architecture request draft completed in {TotalMs:F0}ms (extraction {ExtractionMs:F0}ms, post-process {PostProcessMs:F0}ms) overviewLength={OverviewLength} constraints={ConstraintCount} assumptions={AssumptionCount} capabilities={CapabilityCount}",
            totalMs,
            extractionMs,
            postProcessMs,
            overviewLength,
            constraintCount,
            assumptionCount,
            capabilityCount);

        if (totalMs < SlowDraftWarningThresholdMs)
            return;

        _logger.LogWarning(
            DraftSlowEvent,
            "Architecture request draft exceeded slow threshold ({TotalMs:F0}ms >= {ThresholdMs}ms) overviewLength={OverviewLength}",
            totalMs,
            SlowDraftWarningThresholdMs,
            overviewLength);
    }
}
