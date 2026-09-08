using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Groups verification results by engine type with min-sample floor (DX-56).</summary>
public static class EngineVerificationConfirmedRateAggregation
{
    public const double NeutralPriorRate = 0.5;

    public static IReadOnlyList<EngineVerificationConfirmedRateRow> BuildRows(
        IEnumerable<EngineVerificationResultEngineRef> results,
        int minSample)
    {
        ArgumentNullException.ThrowIfNull(results);

        if (minSample <= 0)
            minSample = 1;

        Dictionary<string, (int ConfirmedNumerator, int VerifiableDenominator)> counts =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (EngineVerificationResultEngineRef result in results)
        {
            if (string.IsNullOrWhiteSpace(result.EngineType))
                continue;

            if (result.Status == FindingVerificationStatus.NotVerifiable)
                continue;

            string engineType = result.EngineType.Trim();

            if (!counts.TryGetValue(engineType, out (int ConfirmedNumerator, int VerifiableDenominator) bucket))
            {
                bucket = (0, 0);
            }

            bucket.VerifiableDenominator++;

            if (result.Status is FindingVerificationStatus.Materialized
                or FindingVerificationStatus.Mitigated)
            {
                bucket.ConfirmedNumerator++;
            }

            counts[engineType] = bucket;
        }

        return counts
            .OrderBy(static pair => pair.Key, StringComparer.Ordinal)
            .Select(pair => new EngineVerificationConfirmedRateRow
            {
                EngineType = pair.Key,
                VerifiableDenominator = pair.Value.VerifiableDenominator,
                ConfirmedNumerator = pair.Value.ConfirmedNumerator,
                ConfirmedRate = pair.Value.VerifiableDenominator >= minSample
                    ? (double)pair.Value.ConfirmedNumerator / pair.Value.VerifiableDenominator
                    : null,
            })
            .ToList();
    }

    public sealed record EngineVerificationResultEngineRef(string EngineType, FindingVerificationStatus Status);
}
