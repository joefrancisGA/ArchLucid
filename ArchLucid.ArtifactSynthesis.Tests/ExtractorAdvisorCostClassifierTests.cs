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

    [Fact]
    public void ClassifyFromAdvisorCostJson_reads_aws_finding_and_monthly_savings()
    {
        const string json =
            """
            {
              "recommendations": [
                {
                  "id": "aws-rec-1",
                  "finding": "Idle EBS volume",
                  "estimatedMonthlySavings": 40
                }
              ]
            }
            """;

        IReadOnlyList<AdvisorCostRecommendationFinding> findings =
            ExtractorAdvisorCostClassifier.ClassifyFromAdvisorCostJson(
                json,
                "AWS cost recommendation",
                "aws-cost-entry");

        findings.Should().ContainSingle();
        findings[0].RecommendationId.Should().Be("aws-rec-1");
        findings[0].Title.Should().Be("Idle EBS volume");
        findings[0].EstimatedAnnualSavingsUsd.Should().Be(480m);
        findings[0].InventoryResourceId.Should().BeNull();
    }

    [Fact]
    public void ClassifyFromAdvisorCostJson_reads_inventory_resource_id_from_resourceMetadata()
    {
        const string json =
            """
            {
              "recommendations": [
                {
                  "id": "rec-1",
                  "finding": "Idle VM",
                  "resourceMetadata": {
                    "resourceId": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-demo/providers/Microsoft.Compute/virtualMachines/vm-demo"
                  }
                }
              ]
            }
            """;

        IReadOnlyList<AdvisorCostRecommendationFinding> findings =
            ExtractorAdvisorCostClassifier.ClassifyFromAdvisorCostJson(json);

        findings.Should().ContainSingle();
        findings[0].InventoryResourceId.Should().Contain("/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-demo/");
    }

    [Fact]
    public void ClassifyFromAdvisorCostJson_reads_gcp_recommender_cost_projection()
    {
        const string json =
            """
            {
              "recommendations": [
                {
                  "name": "gcp-rec-1",
                  "recommenderSubtype": "CHANGE_MACHINE_TYPE",
                  "primaryImpact": {
                    "costProjection": {
                      "cost": {
                        "units": "-50"
                      }
                    }
                  }
                }
              ]
            }
            """;

        IReadOnlyList<AdvisorCostRecommendationFinding> findings =
            ExtractorAdvisorCostClassifier.ClassifyFromAdvisorCostJson(
                json,
                "GCP cost recommendation",
                "gcp-cost-entry");

        findings.Should().ContainSingle();
        findings[0].RecommendationId.Should().Be("gcp-rec-1");
        findings[0].Title.Should().Be("CHANGE_MACHINE_TYPE");
        findings[0].EstimatedAnnualSavingsUsd.Should().Be(600m);
    }
}
