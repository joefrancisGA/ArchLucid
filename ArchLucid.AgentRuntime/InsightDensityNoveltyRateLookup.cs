using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared tenant novelty-rate lookup for judge-cap selection and insight-generator ranking (DX-35/DX-38).
/// </summary>
internal static class InsightDensityNoveltyRateLookup
{
    internal const int DefaultNoveltyRateWindowDays = 90;

    internal const string InsightGeneratorClaimBoundary =
        "Rates are DidNotThinkOfThatCount / DecisionGradeCount — internal ranking only, not a named-model benchmark or G-REAL-06 proof.";

    internal static async Task<IReadOnlyDictionary<string, double>?> TryLoadNoveltyRatesAsync(
        InsightDensityGateOptions options,
        IFindingInsightSignalRepository insightSignalRepository,
        IScopeContextProvider scopeContextProvider,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(insightSignalRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(timeProvider);
        ArgumentNullException.ThrowIfNull(logger);

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
                "Insight-density novelty-rate lookup failed; continuing without novelty ranking context.");

            return null;
        }
    }

    internal static double ResolveNoveltyRate(
        string? engineType,
        IReadOnlyDictionary<string, double> noveltyRatesByEngineType)
    {
        ArgumentNullException.ThrowIfNull(noveltyRatesByEngineType);

        if (string.IsNullOrWhiteSpace(engineType))
        {
            return 0;
        }

        return noveltyRatesByEngineType.TryGetValue(engineType.Trim(), out double rate)
            ? rate
            : 0;
    }
}
