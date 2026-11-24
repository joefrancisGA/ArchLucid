using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftRequestListStatusFilterTests
{
    [Fact]
    public void ParseOrDefault_null_returns_default_inventory_statuses()
    {
        IReadOnlyList<DraftRequestStatus> statuses = DraftRequestListStatusFilter.ParseOrDefault(null);

        statuses.Should().Contain(
        [
            DraftRequestStatus.Drafting,
            DraftRequestStatus.Admitted,
            DraftRequestStatus.Submitted,
            DraftRequestStatus.RunSpawned,
            DraftRequestStatus.Abandoned,
        ]);
    }

    [Fact]
    public void ParseOrDefault_comma_separated_parses_statuses()
    {
        IReadOnlyList<DraftRequestStatus> statuses =
            DraftRequestListStatusFilter.ParseOrDefault("Drafting,Admitted");

        statuses.Should().Equal(DraftRequestStatus.Drafting, DraftRequestStatus.Admitted);
    }

    [Fact]
    public void ParseOrDefault_unknown_status_throws()
    {
        Action act = () => DraftRequestListStatusFilter.ParseOrDefault("Drafting,NotAStatus");

        act.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("2147483647")]
    [InlineData("-2147483648")]
    public void ParseOrDefault_undefined_numeric_status_throws(string value)
    {
        Action act = () => DraftRequestListStatusFilter.ParseOrDefault(value);

        act.Should().Throw<InvalidOperationException>();
    }
}
