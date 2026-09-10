using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Loads gate-vs-human calibration residuals for Premium judge-cap selection (DX-67).
/// </summary>
internal static class InsightDensityHumanAcceptResidualLookup
{
    internal static async Task<IReadOnlyDictionary<string, double>?> TryLoadResidualsAsync(
        InsightDensityGateOptions options,
        IReadOnlyList<Finding> candidates,
        IFindingInsightSignalRepository insightSignalRepository,
        IScopeContextProvider scopeContextProvider,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(insightSignalRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(timeProvider);
        ArgumentNullException.ThrowIfNull(logger);

        if (!ShouldApplyHumanAcceptResidualSort(options))
        {
            return null;
        }

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();

            if (scope.TenantId == Guid.Empty)
            {
                return null;
            }

            int windowDays = options.NoveltyRateWindowDays > 0
                ? options.NoveltyRateWindowDays
                : InsightDensityNoveltyRateLookup.DefaultNoveltyRateWindowDays;

            DateTime toUtcExclusive = timeProvider.GetUtcNow().UtcDateTime;
            DateTime fromUtc = toUtcExclusive.AddDays(-windowDays);

            IReadOnlyList<EngineInsightNoveltyRateRow> noveltyRates = await insightSignalRepository.ListNoveltyRatesAsync(
                scope,
                fromUtc,
                toUtcExclusive,
                cancellationToken);

            return InsightDensityGateHumanCalibrationCalculator.TryBuildJudgeResidualMap(candidates, noveltyRates);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Insight-density human-accept residual lookup failed; continuing without residual ranking context.");

            return null;
        }
    }

    internal static bool ShouldApplyHumanAcceptResidualSort(InsightDensityGateOptions options)
    {
        return options.PreferHighHumanAcceptResidual
            && options.EnableLlmJudge
            && options.EnableLlmJudgeForEngineFindings;
    }
}
