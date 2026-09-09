using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

public static class FindingVerificationReportConfirmedRateCalculator
{
    public static FindingVerificationReportConfirmedRateSummary Compute(
        IReadOnlyList<FindingVerificationResultRecord> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        int materializedCount = results.Count(result => result.Status == FindingVerificationStatus.Materialized);
        int mitigatedCount = results.Count(result => result.Status == FindingVerificationStatus.Mitigated);
        int notObservedCount = results.Count(result => result.Status == FindingVerificationStatus.NotObserved);
        int notVerifiableCount = results.Count(result => result.Status == FindingVerificationStatus.NotVerifiable);
        int verifiableDenominator = results.Count - notVerifiableCount;
        int confirmedNumerator = materializedCount + mitigatedCount;

        double? confirmedRate = verifiableDenominator > 0
            ? (double)confirmedNumerator / verifiableDenominator
            : null;

        return new FindingVerificationReportConfirmedRateSummary
        {
            TotalResults = results.Count,
            MaterializedCount = materializedCount,
            MitigatedCount = mitigatedCount,
            NotObservedCount = notObservedCount,
            NotVerifiableCount = notVerifiableCount,
            VerifiableDenominator = verifiableDenominator,
            ConfirmedNumerator = confirmedNumerator,
            ConfirmedRate = confirmedRate,
        };
    }
}
