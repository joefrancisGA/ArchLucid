using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SpecialistReviewModelAdequacyTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void AssessRecovery_fails_when_backup_interval_exceeds_stated_rto()
    {
        ArchitectureKnowledgeModel model = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "rto",
                Kind = ArchitectureElementKind.RecoveryObjective,
                Name = "Stated recovery objective: RTO 30 minutes.",
            },
            new ArchitectureModelElement
            {
                ElementId = "backup",
                Kind = ArchitectureElementKind.Constraint,
                Name = "Documented backup interval: 240 minutes",
            });

        SpecialistReviewModelAdequacy.RecoveryAdequacyAssessment assessment =
            SpecialistReviewModelAdequacy.AssessRecovery(model);

        assessment.Outcome.Should().Be(SpecialistReviewModelAdequacy.RecoveryAdequacyOutcome.Inadequate);
        assessment.StatedRtoMinutes.Should().Be(30);
        assessment.BackupIntervalMinutes.Should().Be(240);
    }

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
    public void SpecialistReviewService_fails_reliability_when_rto_and_backup_conflict()
    {
        SpecialistReviewService sut = new();
        ArchitectureKnowledgeModel model = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "rto",
                Kind = ArchitectureElementKind.RecoveryObjective,
                Name = "RTO 30 minutes",
            },
            new ArchitectureModelElement
            {
                ElementId = "backup",
                Kind = ArchitectureElementKind.Constraint,
                Name = "backup interval 4 hours",
            });

        SpecialistReviewResult result = sut.Review(model);

        SpecialistReviewFinding reliabilityFinding = result.Findings
            .Single(finding => finding.Dimension == QualityDimension.Reliability);

        reliabilityFinding.Conclusion.Should().Be(ReviewConclusion.Fail);
        reliabilityFinding.Title.Should().Contain("recovery objective");
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
