using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class PolicyEvidenceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "policyId": "pol-1",
              "title": "title",
              "summary": "summary",
              "requiredControls": null,
              "tags": null
            }
            """;

        PolicyEvidence evidence = JsonSerializer.Deserialize<PolicyEvidence>(json, ContractJson.Default)!;

        evidence.RequiredControls.Should().NotBeNull().And.BeEmpty();
        evidence.Tags.Should().NotBeNull().And.BeEmpty();
    }
}
