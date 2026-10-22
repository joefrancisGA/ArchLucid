using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PrimaryPillarKeySelectorTests
{
    [Fact]
    public void Select_returns_pillar_with_highest_severity_weight()
    {
        List<PillarPosture> pillars =
        [
            CreatePillar(nameof(ArchitecturePillar.Security), displayOrder: 1, warningCount: 5),
            CreatePillar(nameof(ArchitecturePillar.CostEffectiveness), displayOrder: 4, errorCount: 1),
        ];

        string? primary = PrimaryPillarKeySelector.Select(pillars);

        primary.Should().Be(nameof(ArchitecturePillar.CostEffectiveness));
    }

    [Fact]
    public void Select_breaks_ties_by_display_order()
    {
        List<PillarPosture> pillars =
        [
            CreatePillar(nameof(ArchitecturePillar.OperationalExcellence), displayOrder: 5, warningCount: 2),
            CreatePillar(nameof(ArchitecturePillar.Security), displayOrder: 1, warningCount: 2),
        ];

        string? primary = PrimaryPillarKeySelector.Select(pillars);

        primary.Should().Be(nameof(ArchitecturePillar.Security));
    }

    private static PillarPosture CreatePillar(
        string pillarKey,
        int displayOrder,
        int warningCount = 0,
        int errorCount = 0) =>
        new()
        {
            PillarKey = pillarKey,
            DisplayName = pillarKey,
            DisplayOrder = displayOrder,
            FindingCounts = new PillarFindingAggregate
            {
                PillarKey = pillarKey,
                WarningCount = warningCount,
                ErrorCount = errorCount,
            },
            Examination = new ExaminationStateResolution
            {
                State = PillarExaminationState.NotExamined,
                ReasonText = ExaminationStateResolver.NotExaminedReason,
            },
        };
}
