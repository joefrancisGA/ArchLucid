using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceEnvironmentCatalogDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "isAdministratorConfigured": false,
              "environments": null,
              "transitions": null
            }
            """;

        GovernanceEnvironmentCatalog catalog =
            JsonSerializer.Deserialize<GovernanceEnvironmentCatalog>(json, ContractJson.CamelCaseCompact)!;

        catalog.Environments.Should().NotBeNull().And.BeEmpty();
        catalog.Transitions.Should().NotBeNull().And.BeEmpty();
    }
}
