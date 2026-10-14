using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class RequestEvidenceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "description": "desc",
              "constraints": null,
              "requiredCapabilities": null,
              "assumptions": null
            }
            """;

        RequestEvidence evidence = JsonSerializer.Deserialize<RequestEvidence>(json, ContractJson.Default)!;

        evidence.Constraints.Should().NotBeNull().And.BeEmpty();
        evidence.RequiredCapabilities.Should().NotBeNull().And.BeEmpty();
        evidence.Assumptions.Should().NotBeNull().And.BeEmpty();
    }
}
