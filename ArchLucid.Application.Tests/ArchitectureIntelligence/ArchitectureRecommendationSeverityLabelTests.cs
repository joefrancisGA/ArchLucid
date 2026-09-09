using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationSeverityLabelTests
{
    [Fact]
    public void BuildRecommendations_trims_padded_critical_severity_for_human_approval_and_effort_band()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-critical-padded",
            Dimension = QualityDimension.Operations,
            Title = "Runbook coverage gap for production cutover",
            Rationale = "No runbook records rollback for the cutover path.",
            Conclusion = ReviewConclusion.Fail,
            Severity = " Critical ",
        };

        ArchitectureRecommendation recommendation = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel
            {
                ModelId = "m",
                TenantId = "t",
            },
            [finding],
            ["Operations"]).Single();

        recommendation.RequiresHumanApproval.Should().BeTrue();
        recommendation.Effort.Band.Should().Be("High");
    }
}
