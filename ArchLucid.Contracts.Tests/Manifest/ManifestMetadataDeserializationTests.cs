using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class ManifestMetadataDeserializationTests
{
    [Fact]
    public void Deserialize_null_decision_trace_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "manifestVersion": "v1",
              "decisionTraceIds": null
            }
            """;

        ManifestMetadata metadata = JsonSerializer.Deserialize<ManifestMetadata>(json, ContractJson.Default)!;

        metadata.DecisionTraceIds.Should().NotBeNull().And.BeEmpty();
    }
}
