using System.Linq;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Orders engine findings for Premium judge-cap selection (DX-21/DX-34 preferred engines; DX-35 novelty sort).
/// </summary>
internal static class InsightDensityJudgeCandidateSelector
{
    internal const int DefaultNoveltyRateWindowDays = 90;

    internal static async Task<(IReadOnlyList<Finding> Judged, int SkippedByCap)> SelectEngineJudgedCandidatesAsync(
        IReadOnlyList<Finding> candidates,
        InsightDensityGateOptions options,
        IFindingInsightSignalRepository? insightSignalRepository,
        IScopeContextProvider? scopeContextProvider,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<string, double>? noveltyRatesByEngineType = null;

        if (ShouldApplyNoveltySort(options)
            && insightSignalRepository is not null
            && scopeContextProvider is not null)
        {
            noveltyRatesByEngineType = await TryLoadNoveltyRatesAsync(
                options,
                insightSignalRepository,
                scopeContextProvider,
                timeProvider,
                logger,
                cancellationToken);
        }

        return SelectEngineJudgedCandidates(
            candidates,
            options.MaxJudgedFindingsPerSnapshot,
            noveltyRatesByEngineType);
    }

    internal static (IReadOnlyList<Finding> Judged, int SkippedByCap) SelectEngineJudgedCandidates(
        IReadOnlyList<Finding> candidates,
        int maxJudgedFindingsPerSnapshot,
        IReadOnlyDictionary<string, double>? noveltyRatesByEngineType = null)
    {
        IOrderedEnumerable<Finding> orderedQuery = candidates
            .OrderByDescending(static finding => InsightDensityPreferredEngineTypes.IsPreferred(finding.EngineType));

        if (noveltyRatesByEngineType is not null)
        {
            orderedQuery = orderedQuery.ThenByDescending(finding =>
                ResolveNoveltyRate(finding.EngineType, noveltyRatesByEngineType));
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

    private static async Task<IReadOnlyDictionary<string, double>?> TryLoadNoveltyRatesAsync(
        InsightDensityGateOptions options,
        IFindingInsightSignalRepository insightSignalRepository,
        IScopeContextProvider scopeContextProvider,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();

            if (scope.TenantId == Guid.Empty)
            {
                return null;
            }

            int windowDays = options.NoveltyRateWindowDays > 0
                ? options.NoveltyRateWindowDays
                : DefaultNoveltyRateWindowDays;

            DateTime toUtcExclusive = timeProvider.GetUtcNow().UtcDateTime;
            DateTime fromUtc = toUtcExclusive.AddDays(-windowDays);

            IReadOnlyList<EngineInsightNoveltyRateRow> rows = await insightSignalRepository.ListNoveltyRatesAsync(
                scope,
                fromUtc,
                toUtcExclusive,
                cancellationToken);

            Dictionary<string, double> ratesByEngineType = new(StringComparer.OrdinalIgnoreCase);

            foreach (EngineInsightNoveltyRateRow row in rows)
            {
                if (string.IsNullOrWhiteSpace(row.EngineType))
                {
                    continue;
                }

                ratesByEngineType[row.EngineType.Trim()] = row.Rate ?? 0;
            }

            return ratesByEngineType;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Insight-density novelty-rate lookup failed; falling back to default judge-cap ordering.");

            return null;
        }
    }

    private static double ResolveNoveltyRate(
        string? engineType,
        IReadOnlyDictionary<string, double> noveltyRatesByEngineType)
    {
        if (string.IsNullOrWhiteSpace(engineType))
        {
            return 0;
        }

        return noveltyRatesByEngineType.TryGetValue(engineType.Trim(), out double rate)
            ? rate
            : 0;
    }
}
