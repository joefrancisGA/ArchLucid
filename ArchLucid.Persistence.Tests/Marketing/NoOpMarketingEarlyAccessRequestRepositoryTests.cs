using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Marketing;

namespace ArchLucid.Persistence.Tests.Marketing;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class NoOpMarketingEarlyAccessRequestRepositoryTests
{
    [SkippableFact]
    public async Task AppendAsync_returns_null_and_does_not_throw()
    {
        NoOpMarketingEarlyAccessRequestRepository sut = new();

        MarketingEarlyAccessRequestInsertResult? r = await sut.AppendAsync(
            "a@b.com",
            "Co",
            "Architect",
            null,
            null,
            null,
            null,
            CancellationToken.None);

        r.Should().BeNull();
    }
}
