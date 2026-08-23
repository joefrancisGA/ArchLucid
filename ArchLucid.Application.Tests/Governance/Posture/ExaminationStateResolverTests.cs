using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExaminationStateResolverTests
{
    private static readonly ExaminationStateResolver Resolver = new();
    private static readonly DateTimeOffset SnapshotUtc = new(2026, 3, 1, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset AssignmentUtc = new(2026, 2, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Resolve_returns_unavailable_when_pack_assignments_are_not_available()
    {
        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: false);

        resolution.State.Should().Be(PillarExaminationState.Unavailable);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.UnavailableReason);
    }

    [Fact]
    public void Resolve_returns_not_examined_when_no_pack_assignments_exist_for_pillar()
    {
        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.NotExamined);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.NotExaminedReason);
    }

    [Fact]
    public void Resolve_returns_partially_examined_when_only_disabled_packs_are_assigned()
    {
        PillarPackAssignment disabledAssignment = CreateAssignment(isEnabled: false);

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [disabledAssignment],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.PartiallyExamined);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.DisabledOnlyReason);
    }

    [Fact]
    public void Resolve_returns_partially_examined_when_no_snapshot_exists()
    {
        PillarPackAssignment enabledAssignment = CreateAssignment(isEnabled: true);

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [enabledAssignment],
            latestSnapshotCreatedUtc: null,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.PartiallyExamined);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.NoSnapshotReason);
    }

    [Fact]
    public void Resolve_returns_partially_examined_when_snapshot_predates_assignment()
    {
        PillarPackAssignment enabledAssignment = CreateAssignment(
            isEnabled: true,
            assignedUtc: SnapshotUtc.AddDays(1));

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [enabledAssignment],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.PartiallyExamined);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.SnapshotPredatesAssignmentReason);
    }

    [Fact]
    public void Resolve_returns_partially_examined_when_uncategorized_findings_exist()
    {
        PillarPackAssignment enabledAssignment = CreateAssignment(isEnabled: true);

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [enabledAssignment],
            SnapshotUtc,
            uncategorizedCount: 2,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.PartiallyExamined);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.UncategorizedReason);
    }

    [Fact]
    public void Resolve_returns_examined_when_enabled_pack_and_current_snapshot_exist()
    {
        PillarPackAssignment enabledAssignment = CreateAssignment(isEnabled: true);

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [enabledAssignment],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.Examined);
        resolution.ReasonText.Should().Be(ExaminationStateResolver.ExaminedReason);
    }

    [Fact]
    public void Resolve_ignores_pack_assignments_for_other_pillars()
    {
        PillarPackAssignment otherPillarAssignment = CreateAssignment(
            isEnabled: true,
            pillarKey: nameof(ArchitecturePillar.CostEffectiveness));

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [otherPillarAssignment],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.NotExamined);
    }

    [Fact]
    public void Resolve_returns_examined_when_snapshot_matches_assignment_time()
    {
        PillarPackAssignment enabledAssignment = CreateAssignment(
            isEnabled: true,
            assignedUtc: SnapshotUtc);

        ExaminationStateResolution resolution = Resolver.Resolve(
            nameof(ArchitecturePillar.Security),
            [enabledAssignment],
            SnapshotUtc,
            uncategorizedCount: 0,
            packAssignmentsAvailable: true);

        resolution.State.Should().Be(PillarExaminationState.Examined);
    }

    private static PillarPackAssignment CreateAssignment(
        bool isEnabled,
        string pillarKey = nameof(ArchitecturePillar.Security),
        DateTimeOffset? assignedUtc = null) =>
        new()
        {
            PillarKey = pillarKey,
            PolicyPackId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            PolicyPackName = "Security baseline",
            PolicyPackVersion = "1.0.0",
            ScopeLevel = "Project",
            IsEnabled = isEnabled,
            AssignedUtc = assignedUtc ?? AssignmentUtc,
        };
}
