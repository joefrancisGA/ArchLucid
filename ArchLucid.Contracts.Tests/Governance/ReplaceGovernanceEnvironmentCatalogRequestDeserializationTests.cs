using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ReplaceGovernanceEnvironmentCatalogRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "environments": null,
              "transitions": null
            }
            """;

        ReplaceGovernanceEnvironmentCatalogRequest request =
            JsonSerializer.Deserialize<ReplaceGovernanceEnvironmentCatalogRequest>(json, ContractJson.CamelCaseCompact)!;

        request.Environments.Should().NotBeNull().And.BeEmpty();
        request.Transitions.Should().NotBeNull().And.BeEmpty();
    }
}
