using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidCompletenessSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_class_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "mode": "full",
              "visibleNodeCount": 0,
              "visibleEdgeCount": 0,
              "connectedComponentCount": 0,
              "hiddenHopsUsedCount": 0,
              "likelyInCollocationEdgeCount": 0,
              "missingClasses": null,
              "collectedClasses": null
            }
            """;

        InfraEvidenceMermaidCompletenessSummary summary =
            JsonSerializer.Deserialize<InfraEvidenceMermaidCompletenessSummary>(json, ContractJson.CamelCaseCompact)!;

        summary.MissingClasses.Should().NotBeNull().And.BeEmpty();
        summary.CollectedClasses.Should().NotBeNull().And.BeEmpty();
    }
}
