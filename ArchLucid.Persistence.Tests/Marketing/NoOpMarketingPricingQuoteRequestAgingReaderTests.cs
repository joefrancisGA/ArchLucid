using ArchLucid.Contracts.Marketing;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Marketing;

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
