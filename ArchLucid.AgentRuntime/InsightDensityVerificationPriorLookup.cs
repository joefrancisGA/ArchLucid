using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared tenant verification confirmed-rate lookup for judge-cap selection (DX-56).
/// </summary>
internal static class InsightDensityVerificationPriorLookup
{
    internal const int DefaultVerificationPriorWindowDays = 90;

    internal const string VerificationPriorClaimBoundary =
        "Rates are (Materialized + Mitigated) / (total − NotVerifiable) — internal ranking only, not a buyer claim.";

    internal static async Task<IReadOnlyDictionary<string, double>?> TryLoadVerificationPriorsAsync(
        InsightDensityGateOptions options,
        IAppendOnlyFindingVerificationReportRepository verificationReportRepository,
        IScopeContextProvider scopeContextProvider,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(verificationReportRepository);
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

            int windowDays = options.VerificationPriorWindowDays > 0
                ? options.VerificationPriorWindowDays
                : DefaultVerificationPriorWindowDays;

            int minSample = options.VerificationPriorMinSample > 0
                ? options.VerificationPriorMinSample
                : 20;

            DateTime toUtcExclusive = timeProvider.GetUtcNow().UtcDateTime;
            DateTime fromUtc = toUtcExclusive.AddDays(-windowDays);

            IReadOnlyList<EngineVerificationConfirmedRateRow> rows =
                await verificationReportRepository.ListConfirmedRatesByEngineTypeAsync(
                    scope,
                    fromUtc,
                    toUtcExclusive,
                    minSample,
                    cancellationToken);

            Dictionary<string, double> ratesByEngineType = new(StringComparer.OrdinalIgnoreCase);

            foreach (EngineVerificationConfirmedRateRow row in rows)
            {
                if (string.IsNullOrWhiteSpace(row.EngineType))
                {
                    continue;
                }

                if (row.ConfirmedRate is null)
                {
                    continue;
                }

                ratesByEngineType[row.EngineType.Trim()] = row.ConfirmedRate.Value;
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
                "Insight-density verification-prior lookup failed; continuing without verification ranking context.");

            return null;
        }
    }

    internal static double ResolveVerificationPriorRate(
        string? engineType,
        IReadOnlyDictionary<string, double>? verificationPriorRatesByEngineType)
    {
        if (verificationPriorRatesByEngineType is null || string.IsNullOrWhiteSpace(engineType))
        {
            return EngineVerificationConfirmedRateAggregation.NeutralPriorRate;
        }

        return verificationPriorRatesByEngineType.TryGetValue(engineType.Trim(), out double rate)
            ? rate
            : EngineVerificationConfirmedRateAggregation.NeutralPriorRate;
    }
}
