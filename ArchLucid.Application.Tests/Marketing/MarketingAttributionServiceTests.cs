using ArchLucid.Application.Marketing;
using ArchLucid.Core.Marketing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Marketing;

[Trait("Category", "Unit")]
public sealed class MarketingAttributionServiceTests
{
    [Fact]
    public async Task PersistFirstTouchIfPresentAsync_inserts_once_and_skips_empty_utm()
    {
        Mock<ITenantMarketingAttributionRepository> repository = new();
        repository
            .Setup(r => r.TryInsertFirstTouchAsync(
                It.IsAny<Guid>(),
                It.IsAny<MarketingAttributionSnapshot>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        MarketingAttributionService sut = new(repository.Object);
        MarketingAttributionSnapshot snapshot = new()
        {
            UtmSource = "linkedin",
            UtmMedium = "paid",
            UtmCampaign = "pilot-q2",
            CapturedUtc = DateTimeOffset.UtcNow,
        };

        await sut.PersistFirstTouchIfPresentAsync(Guid.NewGuid(), snapshot, CancellationToken.None);

        repository.Verify(
            r => r.TryInsertFirstTouchAsync(
                It.IsAny<Guid>(),
                It.IsAny<MarketingAttributionSnapshot>(),
                "paid_direct",
                "linkedin",
                It.IsAny<CancellationToken>()),
            Times.Once);

        await sut.PersistFirstTouchIfPresentAsync(
            Guid.NewGuid(),
            new MarketingAttributionSnapshot { UtmSource = " ", UtmMedium = null },
            CancellationToken.None);

        repository.Verify(
            r => r.TryInsertFirstTouchAsync(
                It.IsAny<Guid>(),
                It.IsAny<MarketingAttributionSnapshot>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PersistFirstTouchIfPresentAsync_does_not_emit_conversion_when_insert_skipped()
    {
        Mock<ITenantMarketingAttributionRepository> repository = new();
        repository
            .Setup(r => r.TryInsertFirstTouchAsync(
                It.IsAny<Guid>(),
                It.IsAny<MarketingAttributionSnapshot>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        MarketingAttributionService sut = new(repository.Object);

        await sut.PersistFirstTouchIfPresentAsync(
            Guid.NewGuid(),
            new MarketingAttributionSnapshot { UtmSource = "google", UtmMedium = "cpc" },
            CancellationToken.None);

        repository.Verify(
            r => r.TryInsertFirstTouchAsync(
                It.IsAny<Guid>(),
                It.IsAny<MarketingAttributionSnapshot>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
