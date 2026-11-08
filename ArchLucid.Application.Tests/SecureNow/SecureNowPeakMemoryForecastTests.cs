using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowPeakMemoryForecastTests
{
    [Fact]
    public void Bracketed_cohort_produces_advisory_budget_not_peak_claim()
    {
        SecureNowPeakMemoryForecast.Sample[] samples =
        [
            new("branch", 50, 20, 40, 2, 1000, false, "DEDICATED_PROCESS_SAMPLED"),
            new("branch", 500, 200, 400, 4, 3000, false, "DEDICATED_PROCESS_SAMPLED")
        ];
        var result = SecureNowPeakMemoryForecast.Estimate(samples, "branch", 100, 80, 150, 3);
        result.Available.Should().BeTrue();
        result.ObservedFloorBytes.Should().Be(3000);
        result.AdvisoryBudgetBytes.Should().Be(4500);
        result.EvidenceStatus.Should().Contain("NOT_VERIFIED_PEAK");
    }

    [Fact]
    public void Missing_truncated_or_out_of_envelope_samples_fail_closed()
    {
        SecureNowPeakMemoryForecast.Sample[] samples =
        [
            new("branch", 50, 20, 40, 2, 1000, false, "DEDICATED_PROCESS_SAMPLED"),
            new("branch", 500, 200, 400, 4, 3000, true, "DEDICATED_PROCESS_SAMPLED")
        ];
        SecureNowPeakMemoryForecast.Estimate(samples, "branch", 100, 80, 150, 3)
            .Available.Should().BeFalse();
        SecureNowPeakMemoryForecast.Estimate(samples, "other", 100, 80, 150, 3)
            .Available.Should().BeFalse();
    }
}
