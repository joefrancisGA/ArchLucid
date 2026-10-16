using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningAggregationSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "scope": {
                "tenantId": "00000000-0000-0000-0000-000000000001",
                "workspaceId": "00000000-0000-0000-0000-000000000002",
                "projectId": "00000000-0000-0000-0000-000000000003"
              },
              "feedbackRollups": null,
              "artifactTrends": null,
              "topRejectedRevisedRollups": null,
              "repeatedCommentThemes": null
            }
            """;

        ProductLearningAggregationSnapshot? result =
            JsonSerializer.Deserialize<ProductLearningAggregationSnapshot>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FeedbackRollups.Should().NotBeNull().And.BeEmpty();
        result.ArtifactTrends.Should().NotBeNull().And.BeEmpty();
        result.TopRejectedRevisedRollups.Should().NotBeNull().And.BeEmpty();
        result.RepeatedCommentThemes.Should().NotBeNull().And.BeEmpty();
    }
}
