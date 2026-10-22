using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopReasoningResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "specialistReviews": null,
              "recommendations": null,
              "impactResults": null,
              "mustNotFailViolations": null,
              "validationResults": null,
              "productFindings": null,
              "productRecommendations": null,
              "publishBlockReasons": null,
              "integrityPassedFindingIds": null,
              "modelDiffs": null
            }
            """;

        ClosedLoopReasoningResult? result =
            JsonSerializer.Deserialize<ClosedLoopReasoningResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SpecialistReviews.Should().NotBeNull().And.BeEmpty();
        result.Recommendations.Should().NotBeNull().And.BeEmpty();
        result.ImpactResults.Should().NotBeNull().And.BeEmpty();
        result.MustNotFailViolations.Should().NotBeNull().And.BeEmpty();
        result.ValidationResults.Should().NotBeNull().And.BeEmpty();
        result.ProductFindings.Should().NotBeNull().And.BeEmpty();
        result.ProductRecommendations.Should().NotBeNull().And.BeEmpty();
        result.PublishBlockReasons.Should().NotBeNull().And.BeEmpty();
        result.IntegrityPassedFindingIds.Should().NotBeNull().And.BeEmpty();
        result.ModelDiffs.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_nested_reasoning_objects_yields_non_null_defaults()
    {
        const string json = """
            {
              "model": null,
              "interview": null,
              "adversarial": null
            }
            """;

        ClosedLoopReasoningResult? result =
            JsonSerializer.Deserialize<ClosedLoopReasoningResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Model.Should().NotBeNull();
        result.Interview.Should().NotBeNull();
        result.Adversarial.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_re_review_and_golden_metrics_remain_null()
    {
        const string json = """
            {
              "reReview": null,
              "goldenMetrics": null
            }
            """;

        ClosedLoopReasoningResult? result =
            JsonSerializer.Deserialize<ClosedLoopReasoningResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ReReview.Should().BeNull();
        result.GoldenMetrics.Should().BeNull();
    }
}
