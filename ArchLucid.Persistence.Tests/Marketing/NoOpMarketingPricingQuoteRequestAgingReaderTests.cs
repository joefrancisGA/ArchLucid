using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Marketing;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Marketing;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class NoOpMarketingPricingQuoteRequestAgingReaderTests
{
    [Fact]
    public async Task ListAsync_returns_empty_list()
    {
        NoOpMarketingPricingQuoteRequestAgingReader sut = new();

        IReadOnlyList<MarketingPricingQuoteRequestAgingRow> rows =
            await sut.ListAsync(CancellationToken.None);

        rows.Should().BeEmpty();
    }
}
