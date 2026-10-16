using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceReviewsAwaitingActionResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        GovernanceReviewsAwaitingActionResponse response =
            JsonSerializer.Deserialize<GovernanceReviewsAwaitingActionResponse>(json, ContractJson.Default)!;

        response.Items.Should().NotBeNull().And.BeEmpty();
    }
}
