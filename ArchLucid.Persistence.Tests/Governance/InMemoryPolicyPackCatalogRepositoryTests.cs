using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Governance;

public sealed class InMemoryPolicyPackCatalogRepositoryTests
{
    [Fact]
    public async Task Upsert_list_get_demote_roundtrip()
    {
        InMemoryPolicyPackCatalogRepository sut = new();
        PolicyPackCatalogEntryDetail promoted = await sut.UpsertPromotedFromSnapshotAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            "Demo",
            "desc",
            "ProjectCustom",
            "1.0.0",
            """{"complianceRuleKeys":["k"],"complianceRuleIds":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{},"metadata":{}}""",
            CancellationToken.None);

        IReadOnlyList<PolicyPackCatalogListItem> list = await sut.ListPromotedAsync(CancellationToken.None);
        list.Should().ContainSingle();
        list[0].DisplayName.Should().Be("Demo");

        PolicyPackCatalogEntryDetail? detail =
            await sut.GetPromotedDetailByIdAsync(promoted.PolicyPackCatalogEntryId, CancellationToken.None);
        detail.Should().NotBeNull();
        detail!.SnapshotContentJson.Should().Contain("complianceRuleKeys");

        bool demoted = await sut.TryDemoteAsync(promoted.PolicyPackCatalogEntryId, CancellationToken.None);
        demoted.Should().BeTrue();

        IReadOnlyList<PolicyPackCatalogListItem> after = await sut.ListPromotedAsync(CancellationToken.None);
        after.Should().BeEmpty();
    }
}
