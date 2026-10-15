using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.User;

[Trait("Category", "Unit")]
public sealed class WorkingWorkspaceContinuityDtoDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "favoriteReviews": null,
              "recentViewEntries": null
            }
            """;

        WorkingWorkspaceContinuityDto? result =
            JsonSerializer.Deserialize<WorkingWorkspaceContinuityDto>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FavoriteReviews.Should().NotBeNull().And.BeEmpty();
        result.RecentViewEntries.Should().NotBeNull().And.BeEmpty();
    }
}
