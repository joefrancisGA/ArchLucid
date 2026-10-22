using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingVerificationReportConfirmedRateCalculatorTests
{
    [Fact]
    public void Compute_excludes_not_verifiable_from_denominator()
    {
        List<FindingVerificationResultRecord> results =
        [
            Result(FindingVerificationStatus.Materialized),
            Result(FindingVerificationStatus.Mitigated),
            Result(FindingVerificationStatus.NotObserved),
            Result(FindingVerificationStatus.NotVerifiable),
        ];

        FindingVerificationReportConfirmedRateSummary summary =
            FindingVerificationReportConfirmedRateCalculator.Compute(results);

        summary.TotalResults.Should().Be(4);
        summary.VerifiableDenominator.Should().Be(3);
        summary.ConfirmedNumerator.Should().Be(2);
        summary.ConfirmedRate.Should().BeApproximately(2.0 / 3.0, 0.0001);
    }

    [Fact]
    public void Compute_returns_null_rate_when_no_verifiable_findings()
    {
        List<FindingVerificationResultRecord> results =
        [
            Result(FindingVerificationStatus.NotVerifiable),
        ];

        FindingVerificationReportConfirmedRateSummary summary =
            FindingVerificationReportConfirmedRateCalculator.Compute(results);

        summary.VerifiableDenominator.Should().Be(0);
        summary.ConfirmedRate.Should().BeNull();
    }

    private static FindingVerificationResultRecord Result(FindingVerificationStatus status) =>
        new()
        {
            ResultId = Guid.NewGuid(),
            ReportId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FindingId = "finding-1",
            Status = status,
            TraceText = "trace",
        };
}
