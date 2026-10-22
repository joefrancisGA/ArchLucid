using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class PatternEvidenceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "patternId": "pat-1",
              "name": "name",
              "summary": "summary",
              "applicableCapabilities": null,
              "suggestedServices": null
            }
            """;

        PatternEvidence evidence = JsonSerializer.Deserialize<PatternEvidence>(json, ContractJson.Default)!;

        evidence.ApplicableCapabilities.Should().NotBeNull().And.BeEmpty();
        evidence.SuggestedServices.Should().NotBeNull().And.BeEmpty();
    }
}
