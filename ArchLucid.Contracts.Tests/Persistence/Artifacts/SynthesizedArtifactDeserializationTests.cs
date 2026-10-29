using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Artifacts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Artifacts;

[Trait("Category", "Unit")]
public sealed class SynthesizedArtifactDeserializationTests
{
    [Fact]
    public void Deserialize_null_contributing_decision_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "artifactId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "runId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "manifestId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "createdUtc": "2026-10-29T12:00:00Z",
              "artifactType": "inventory",
              "name": "inventory.json",
              "format": "json",
              "content": "{}",
              "contentHash": "abc",
              "contributingDecisionIds": null
            }
            """;

        SynthesizedArtifact? artifact =
            JsonSerializer.Deserialize<SynthesizedArtifact>(json, ContractJson.CamelCaseCompact);

        artifact.Should().NotBeNull();
        artifact!.ContributingDecisionIds.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_metadata_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "artifactId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "runId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "manifestId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "createdUtc": "2026-10-29T12:00:00Z",
              "artifactType": "inventory",
              "name": "inventory.json",
              "format": "json",
              "content": "{}",
              "contentHash": "abc",
              "metadata": null
            }
            """;

        SynthesizedArtifact? artifact =
            JsonSerializer.Deserialize<SynthesizedArtifact>(json, ContractJson.CamelCaseCompact);

        artifact.Should().NotBeNull();
        artifact!.Metadata.Should().NotBeNull().And.BeEmpty();
    }
}
