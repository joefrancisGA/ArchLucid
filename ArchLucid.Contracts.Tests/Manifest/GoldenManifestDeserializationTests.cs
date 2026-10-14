using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class GoldenManifestDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "systemName": "demo",
              "services": null,
              "datastores": null,
              "relationships": null,
              "governance": {},
              "metadata": { "manifestVersion": "v1" }
            }
            """;

        GoldenManifest manifest = JsonSerializer.Deserialize<GoldenManifest>(json, ContractJson.Default)!;

        manifest.Services.Should().NotBeNull().And.BeEmpty();
        manifest.Datastores.Should().NotBeNull().And.BeEmpty();
        manifest.Relationships.Should().NotBeNull().And.BeEmpty();
    }
}
