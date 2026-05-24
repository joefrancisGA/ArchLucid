using ArchLucid.Contracts.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Information-level transparency logs when portfolio ROI totals exclude muted or duplicate findings.
/// </summary>
internal static class ExecutiveRoiFindingExclusionLogger
{
    internal static void LogMutedFindings(
        ILogger logger,
        IEnumerable<ArchitectureFinding> mutedFindings)
    {
        if (!logger.IsEnabled(LogLevel.Information))
            return;

        foreach (ArchitectureFinding finding in mutedFindings)
        {
            logger.LogInformation(
                "Executive ROI summary excluded muted finding {FindingId} with estimated savings {EstimatedUsdSavings}.",
                finding.FindingId ?? "(none)",
                finding.EstimatedUsdSavings);
        }
    }

    internal static IEnumerable<ArchitectureFinding> DeduplicateWithLogging(
        ILogger logger,
        IEnumerable<ArchitectureFinding> findings)
    {
        HashSet<string> seenFindingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
            {
                yield return finding;
                continue;
            }

            if (seenFindingIds.Add(finding.FindingId))
            {
                yield return finding;
                continue;
            }

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation(
                    "Executive ROI summary excluded duplicate finding {FindingId} with estimated savings {EstimatedUsdSavings}.",
                    finding.FindingId,
                    finding.EstimatedUsdSavings);
            }
        }
    }
}
