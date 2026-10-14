using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class PriorManifestEvidenceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "manifestVersion": "v1",
              "summary": "summary",
              "existingServices": null,
              "existingDatastores": null,
              "existingRequiredControls": null
            }
            """;

        PriorManifestEvidence evidence = JsonSerializer.Deserialize<PriorManifestEvidence>(json, ContractJson.Default)!;

        evidence.ExistingServices.Should().NotBeNull().And.BeEmpty();
        evidence.ExistingDatastores.Should().NotBeNull().And.BeEmpty();
        evidence.ExistingRequiredControls.Should().NotBeNull().And.BeEmpty();
    }
}
