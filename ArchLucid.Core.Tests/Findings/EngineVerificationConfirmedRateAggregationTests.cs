using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class EngineVerificationConfirmedRateAggregationTests
{
    [Fact]
    public void BuildRows_returns_null_rate_when_verifiable_denominator_below_min_sample()
    {
        List<EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef> results = [];

        for (int index = 0; index < 19; index++)
        {
            results.Add(new EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef(
                "security-baseline",
                FindingVerificationStatus.Materialized));
        }

        IReadOnlyList<EngineVerificationConfirmedRateRow> rows =
            EngineVerificationConfirmedRateAggregation.BuildRows(results, minSample: 20);

        rows.Should().ContainSingle();
        rows[0].VerifiableDenominator.Should().Be(19);
        rows[0].ConfirmedRate.Should().BeNull();
    }

    [Fact]
    public void BuildRows_computes_confirmed_rate_at_min_sample_excluding_not_verifiable()
    {
        List<EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef> results =
        [
            ..Enumerable.Repeat(
                new EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef(
                    "security-baseline",
                    FindingVerificationStatus.Materialized),
                10),
            ..Enumerable.Repeat(
                new EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef(
                    "security-baseline",
                    FindingVerificationStatus.Mitigated),
                5),
            ..Enumerable.Repeat(
                new EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef(
                    "security-baseline",
                    FindingVerificationStatus.NotObserved),
                5),
            ..Enumerable.Repeat(
                new EngineVerificationConfirmedRateAggregation.EngineVerificationResultEngineRef(
                    "security-baseline",
                    FindingVerificationStatus.NotVerifiable),
                5),
        ];

        IReadOnlyList<EngineVerificationConfirmedRateRow> rows =
            EngineVerificationConfirmedRateAggregation.BuildRows(results, minSample: 20);

        rows.Should().ContainSingle();
        rows[0].VerifiableDenominator.Should().Be(20);
        rows[0].ConfirmedNumerator.Should().Be(15);
        rows[0].ConfirmedRate.Should().Be(0.75);
    }
}
