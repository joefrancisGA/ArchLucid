using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ImmutableSourceArtifactDeserializationTests
{
    [Fact]
    public void Deserialize_null_metadata_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "artifactId": "a1",
              "tenantId": "t1",
              "contentSha256": "abc",
              "contentType": "text/plain",
              "ownershipClass": 0,
              "createdUtc": "2026-01-01T00:00:00Z",
              "version": "v1",
              "metadata": null
            }
            """;

        ImmutableSourceArtifact artifact =
            JsonSerializer.Deserialize<ImmutableSourceArtifact>(json, ContractJson.Default)!;

        artifact.Metadata.Should().NotBeNull().And.BeEmpty();
    }
}
