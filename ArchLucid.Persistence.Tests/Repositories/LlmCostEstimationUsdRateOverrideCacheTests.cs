using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmCostEstimationUsdRateOverrideCacheTests
{
    [Fact]
    public void Set_keeps_newer_rates_when_an_older_or_missing_snapshot_arrives_late()
    {
        LlmCostEstimationUsdRateOverrideCache cache = new();
        DateTime updated = new(2026, 11, 18, 10, 0, 0, DateTimeKind.Utc);
        cache.Set(new LlmCostEstimationUsdRateOverrideRow
        {
            InputUsdPerMillionTokens = 3,
            OutputUsdPerMillionTokens = 9,
            UpdatedUtc = updated,
        });

        cache.Set(new LlmCostEstimationUsdRateOverrideRow
        {
            InputUsdPerMillionTokens = 1,
            OutputUsdPerMillionTokens = 2,
            UpdatedUtc = updated.AddMinutes(-1),
        });
        cache.TryGetUsdPerMillionRates(out decimal input, out decimal output).Should().BeTrue();
        input.Should().Be(3);
        output.Should().Be(9);

        cache.Set(null);
        cache.TryGetUsdPerMillionRates(out input, out output).Should().BeTrue();
        input.Should().Be(3);
        output.Should().Be(9);
    }
}
