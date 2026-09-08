using System.Linq;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Orders engine findings for Premium judge-cap selection (DX-21/DX-34 preferred engines; DX-35 novelty; DX-56 verification priors).
/// </summary>
internal static class InsightDensityJudgeCandidateSelector
{
    internal static async Task<(IReadOnlyList<Finding> Judged, int SkippedByCap)> SelectEngineJudgedCandidatesAsync(
        IReadOnlyList<Finding> candidates,
        InsightDensityGateOptions options,
        IFindingInsightSignalRepository? insightSignalRepository,
        IAppendOnlyFindingVerificationReportRepository? verificationReportRepository,
        IScopeContextProvider? scopeContextProvider,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<string, double>? noveltyRatesByEngineType = null;
        IReadOnlyDictionary<string, double>? verificationPriorRatesByEngineType = null;

        if (ShouldApplyNoveltySort(options)
            && insightSignalRepository is not null
            && scopeContextProvider is not null)
        {
            noveltyRatesByEngineType = await InsightDensityNoveltyRateLookup.TryLoadNoveltyRatesAsync(
                options,
                insightSignalRepository,
                scopeContextProvider,
                timeProvider,
                logger,
                cancellationToken);
        }

        if (ShouldApplyVerificationSort(options)
            && verificationReportRepository is not null
            && scopeContextProvider is not null)
        {
            verificationPriorRatesByEngineType = await InsightDensityVerificationPriorLookup.TryLoadVerificationPriorsAsync(
                options,
                verificationReportRepository,
                scopeContextProvider,
                timeProvider,
                logger,
                cancellationToken);
        }

        return SelectEngineJudgedCandidates(
            candidates,
            options.MaxJudgedFindingsPerSnapshot,
            noveltyRatesByEngineType,
            verificationPriorRatesByEngineType);
    }

    internal static (IReadOnlyList<Finding> Judged, int SkippedByCap) SelectEngineJudgedCandidates(
        IReadOnlyList<Finding> candidates,
        int maxJudgedFindingsPerSnapshot,
        IReadOnlyDictionary<string, double>? noveltyRatesByEngineType = null,
        IReadOnlyDictionary<string, double>? verificationPriorRatesByEngineType = null)
    {
        IOrderedEnumerable<Finding> orderedQuery = candidates
            .OrderByDescending(static finding => InsightDensityPreferredEngineTypes.IsPreferred(finding.EngineType));

        if (verificationPriorRatesByEngineType is not null)
        {
            orderedQuery = orderedQuery.ThenByDescending(finding =>
                InsightDensityVerificationPriorLookup.ResolveVerificationPriorRate(
                    finding.EngineType,
                    verificationPriorRatesByEngineType));
        }

        if (noveltyRatesByEngineType is not null)
        {
            orderedQuery = orderedQuery.ThenByDescending(finding =>
                InsightDensityNoveltyRateLookup.ResolveNoveltyRate(finding.EngineType, noveltyRatesByEngineType));
        }

        List<Finding> ordered = orderedQuery
            .ThenByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.InsightDensityScore ?? int.MaxValue)
            .ThenBy(static finding => finding.FindingId, StringComparer.Ordinal)
            .ToList();

        if (ordered.Count <= maxJudgedFindingsPerSnapshot)
        {
            return (ordered, 0);
        }

        int skipped = ordered.Count - maxJudgedFindingsPerSnapshot;

        return (ordered.Take(maxJudgedFindingsPerSnapshot).ToList(), skipped);
    }

    private static bool ShouldApplyNoveltySort(InsightDensityGateOptions options)
    {
        return options.PreferHighNoveltyEngines
            && options.EnableLlmJudge
            && options.EnableLlmJudgeForEngineFindings;
    }

    private static bool ShouldApplyVerificationSort(InsightDensityGateOptions options)
    {
        return options.PreferHighVerificationEngines
            && options.EnableLlmJudge
            && options.EnableLlmJudgeForEngineFindings;
    }
}
