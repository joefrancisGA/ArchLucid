using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class CloudResourceCurrentConfigurationSectionDeserializationTests
{
    [Fact]
    public void Deserialize_null_properties_and_tags_yields_empty_dictionaries_not_null()
    {
        const string json = """
            {
              "snapshotId": "00000000-0000-0000-0000-000000000001",
              "azureResourceId": "/subscriptions/x",
              "resourceType": "Microsoft.Storage/storageAccounts",
              "properties": null,
              "tags": null
            }
            """;

        CloudResourceCurrentConfigurationSection? result =
            JsonSerializer.Deserialize<CloudResourceCurrentConfigurationSection>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Properties.Should().NotBeNull().And.BeEmpty();
        result.Tags.Should().NotBeNull().And.BeEmpty();
    }
}
