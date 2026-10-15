using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingListDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": "r",
              "relatedNodeIds": null,
              "evidenceRefs": null,
              "recommendedActions": null
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.RelatedNodeIds.Should().NotBeNull().And.BeEmpty();
        finding.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
        finding.RecommendedActions.Should().NotBeNull().And.BeEmpty();
    }
}
