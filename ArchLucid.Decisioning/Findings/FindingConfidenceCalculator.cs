using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Combines schema/harness pass, optional reference-case match, and explainability trace completeness into a single
///     operator-facing score.
/// </summary>
public sealed class FindingConfidenceCalculator(ILogger<FindingConfidenceCalculator>? logger = null)
{
    private readonly ILogger<FindingConfidenceCalculator>? _logger = logger;

    /// <summary>
    ///     Maps additive signals to a 0–100 score and a discrete <see cref="FindingConfidenceLevel" /> for operator-facing display.
    /// </summary>
    /// <param name="schemaValidationPassed">
    ///     When <see langword="true" />, adds 35 points — calibrated as the second-largest structural gate after reference match so invalid artifacts cannot score high.
    /// </param>
    /// <param name="referenceCaseMatched">
    ///     When <see langword="true" />, adds 40 points — largest single bump, reflecting that corpus alignment is the strongest objective similarity signal available here.
    /// </param>
    /// <param name="traceCompletenessRatio">
    ///     Proportion of explainability trace fields populated in <c>[0,1]</c>; contributes up to 25 points after rounding.
    ///     <see langword="null" /> yields <see cref="FindingConfidenceStatus.Unknown" /> (not treated as zero).
    /// </param>
    /// <returns>
    ///     A <see cref="FindingConfidenceCalculationResult" /> with status, optional score/level, and optional failure reason.
    /// </returns>
    /// <remarks>
    ///     Thresholds: score ≥ 75 → <see cref="FindingConfidenceLevel.High" />, ≥ 45 → <see cref="FindingConfidenceLevel.Medium" />, else Low.
    ///     Those cutoffs split the 0–100 range so “High” requires both structural gates and most of the trace weight, or reference match plus solid trace.
    /// </remarks>
    public FindingConfidenceCalculationResult Calculate(
        bool schemaValidationPassed,
        bool referenceCaseMatched,
        decimal? traceCompletenessRatio)
    {
        try
        {
            if (traceCompletenessRatio is null)
                return new FindingConfidenceCalculationResult(FindingConfidenceStatus.Unknown, null, null);

            int score = 0;

            // +35 / +40 / +25 partition the maximum 100 so no single boolean dominates entirely: reference (40) + schema (35) already caps explanatory power of trace (25).

            if (schemaValidationPassed)
                score += 35;

            if (referenceCaseMatched)
                score += 40;

            double ratioRaw = (double)traceCompletenessRatio.Value;

            if (double.IsNaN(ratioRaw) || double.IsInfinity(ratioRaw))
                return new FindingConfidenceCalculationResult(FindingConfidenceStatus.Unknown, null, null);

            double clamped = Math.Clamp(ratioRaw, 0.0, 1.0);
            // Trace term: linear in [0,1] with weight 25 → incomplete traces cap total below “perfect” even when both booleans are true.
            score += (int)Math.Round(clamped * 25.0, MidpointRounding.AwayFromZero);
            score = Math.Clamp(score, 0, 100);

            // 75 / 45: product-chosen bands — High needs strong cumulative evidence; Medium spans partial satisfaction without overcalling certainty.
            FindingConfidenceLevel level = score >= 75
                ? FindingConfidenceLevel.High
                : score >= 45
                    ? FindingConfidenceLevel.Medium
                    : FindingConfidenceLevel.Low;

            return new FindingConfidenceCalculationResult(FindingConfidenceStatus.Computed, score, level);
        }
        catch (Exception ex)
        {
            if (_logger is not null && _logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(ex, "Finding confidence calculation failed.");

            return new FindingConfidenceCalculationResult(
                FindingConfidenceStatus.Failed,
                null,
                null,
                ex.GetType().Name);
        }
    }
}
