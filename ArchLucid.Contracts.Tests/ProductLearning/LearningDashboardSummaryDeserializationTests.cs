using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class LearningDashboardSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "topAggregates": null,
              "artifactTrends": null,
              "opportunities": null,
              "triageQueue": null,
              "summaryNotes": null
            }
            """;

        LearningDashboardSummary? result =
            JsonSerializer.Deserialize<LearningDashboardSummary>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.TopAggregates.Should().NotBeNull().And.BeEmpty();
        result.ArtifactTrends.Should().NotBeNull().And.BeEmpty();
        result.Opportunities.Should().NotBeNull().And.BeEmpty();
        result.TriageQueue.Should().NotBeNull().And.BeEmpty();
        result.SummaryNotes.Should().NotBeNull().And.BeEmpty();
    }
}
