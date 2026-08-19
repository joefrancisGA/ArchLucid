using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class InMemoryPolicyPackCatalogRepositoryAdditionalCoverageTests
{
    [Fact]
    public async Task TryDemoteAsync_returns_false_for_unknown_entry()
    {
        InMemoryPolicyPackCatalogRepository sut = new();

        (await sut.TryDemoteAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task UpsertPromotedFromSnapshotAsync_updates_existing_source_pack()
    {
        InMemoryPolicyPackCatalogRepository sut = new();
        Guid sourcePackId = Guid.NewGuid();

        PolicyPackCatalogEntryDetail first = await sut.UpsertPromotedFromSnapshotAsync(
            sourcePackId,
            "Pack A",
            "desc",
            "security",
            "1.0.0",
            """{"rules":[]}""",
            CancellationToken.None);

        PolicyPackCatalogEntryDetail second = await sut.UpsertPromotedFromSnapshotAsync(
            sourcePackId,
            "Pack A v2",
            "updated",
            "security",
            "1.0.1",
            """{"rules":[{"id":"r1"}]}""",
            CancellationToken.None);

        second.PolicyPackCatalogEntryId.Should().Be(first.PolicyPackCatalogEntryId);
        second.DisplayName.Should().Be("Pack A v2");
        second.SnapshotVersion.Should().Be("1.0.1");

        PolicyPackCatalogEntryDetail? loaded =
            await sut.GetPromotedDetailByIdAsync(first.PolicyPackCatalogEntryId, CancellationToken.None);

        loaded!.DisplayName.Should().Be("Pack A v2");
    }

    [Fact]
    public async Task GetPromotedDetailByIdAsync_returns_null_when_demoted()
    {
        InMemoryPolicyPackCatalogRepository sut = new();

        PolicyPackCatalogEntryDetail detail = await sut.UpsertPromotedFromSnapshotAsync(
            Guid.NewGuid(),
            "Pack",
            "desc",
            "security",
            "1.0.0",
            "{}",
            CancellationToken.None);

        (await sut.TryDemoteAsync(detail.PolicyPackCatalogEntryId, CancellationToken.None)).Should().BeTrue();
        (await sut.GetPromotedDetailByIdAsync(detail.PolicyPackCatalogEntryId, CancellationToken.None)).Should().BeNull();
        (await sut.ListPromotedAsync(CancellationToken.None)).Should().BeEmpty();
    }
}
