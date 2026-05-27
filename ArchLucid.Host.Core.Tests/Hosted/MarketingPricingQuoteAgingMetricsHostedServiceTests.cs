using ArchLucid.Contracts.Marketing;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MarketingPricingQuoteAgingMetricsHostedServiceTests
{
    [Fact]
    public void RecordSnapshot_does_not_throw_for_breach_row()
    {
        MarketingPricingQuoteRequestAgingRow staleRow = new(
            Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            "buyer@example.com",
            "Contoso",
            "Team",
            DateTime.UtcNow.AddHours(-30),
            MarketingPricingQuoteRequestStatus.Open,
            null,
            null,
            30,
            MarketingPricingQuoteRequestBreachStatus.BreachAt24Hours);

        Action act = () => MarketingPricingQuoteAgingMetricsHostedService.RecordSnapshot([staleRow]);

        act.Should().NotThrow();
    }
}
