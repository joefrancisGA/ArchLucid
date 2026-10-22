using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceBatch42Tests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void AssessCost_fails_when_ceiling_is_not_mapped_to_drivers()
    {
        ArchitectureKnowledgeModel model = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "ceiling",
                Kind = ArchitectureElementKind.Constraint,
                Name = "Monthly cost ceiling: $5000",
            },
            new ArchitectureModelElement
            {
                ElementId = "driver",
                Kind = ArchitectureElementKind.CostDriver,
                Name = "Compute and storage spend",
            });

        SpecialistReviewModelAdequacy.CostAdequacyAssessment assessment =
            SpecialistReviewModelAdequacy.AssessCost(model);

        assessment.Outcome.Should().Be(SpecialistReviewModelAdequacy.CostAdequacyOutcome.CeilingNotAddressed);
        assessment.StatedCeilingUsd.Should().Be(5000);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void AssessRecovery_prefers_framing_rto_over_extracted_element()
    {
        ArchitectureKnowledgeModel model = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "rto",
                Kind = ArchitectureElementKind.RecoveryObjective,
                Name = "RTO 4 hours",
            });
        model.FramingAnswers["unacceptable-failures"] = "RTO must be 30 minutes for billing.";

        SpecialistReviewModelAdequacy.RecoveryAdequacyAssessment assessment =
            SpecialistReviewModelAdequacy.AssessRecovery(model);

        assessment.StatedRtoMinutes.Should().Be(30);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ToFindings_maps_lifecycle_scope_and_trace_properties()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-trace",
            Dimension = QualityDimension.Reliability,
            Title = "Recovery gap",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
            LifecycleScope = ArchitectureLifecycleScope.CurrentState,
            RelatedModelElementIds = ["comp-1"],
            RelatedRequirementElementIds = ["req-1"],
            RelatedDecisionElementIds = ["dec-1"],
        };

        List<Finding> mapped = ArchitectureIntelligenceProductBridge.ToFindings([finding]);

        mapped[0].Properties.Should().ContainKey("architectureIntelligence.lifecycleScope");
        mapped[0].Properties["architectureIntelligence.lifecycleScope"]
            .Should().Be(ArchitectureLifecycleScope.CurrentState.ToString());
        mapped[0].Properties.Should().ContainKey("architectureIntelligence.relatedRequirementElementIds");
        mapped[0].Properties.Should().ContainKey("architectureIntelligence.relatedDecisionElementIds");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void GetDeepCases_includes_eight_deep_scenarios()
    {
        ArchitectureIntelligenceBenchmark benchmark = new(new ExtractionFidelityBenchmark());

        benchmark.GetDeepCases().Should().HaveCountGreaterThanOrEqualTo(8);
    }

    private static ArchitectureKnowledgeModel CreateModel(params ArchitectureModelElement[] elements)
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = Guid.NewGuid().ToString("N"),
            TenantId = Guid.NewGuid().ToString("N"),
            Elements = elements.ToList(),
        };
    }
}
