using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExtractorAdvisorCostClassifierTests
{
    [Fact]
    public void ClassifyFromAdvisorCostJson_reads_advisor_value_array()
    {
        const string json =
            """
            {
              "value": [
                {
                  "id": "/subscriptions/sub/providers/Microsoft.Advisor/recommendations/rec1",
                  "properties": {
                    "category": "Cost",
                    "shortDescription": {
                      "problem": "Underutilized VM",
                      "solution": "Resize or shut down"
                    },
                    "potentialSavings": {
                      "annualSavingsAmount": 1200
                    }
                  }
                }
              ]
            }
            """;

        IReadOnlyList<AdvisorCostRecommendationFinding> findings =
            ExtractorAdvisorCostClassifier.ClassifyFromAdvisorCostJson(json);

        findings.Should().ContainSingle();
        findings[0].RecommendationId.Should().Contain("rec1");
        findings[0].Title.Should().Contain("Underutilized VM");
        findings[0].EstimatedAnnualSavingsUsd.Should().Be(1200m);
    }
}
