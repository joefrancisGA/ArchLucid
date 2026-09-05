using ArchLucid.Application.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingMergeConflictResolutionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryResolveAsync_resolves_when_rationale_member_ids_differ_only_by_casing_from_snapshot()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid snapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        const string conflictId = "CONFLICT-1";

        Finding memberA = new()
        {
            FindingId = "FIND-A",
            FindingType = "PolicyViolation",
            Category = "Security",
            EngineType = "engine-a",
            Title = "a",
            Rationale = "a",
            Severity = FindingSeverity.Warning,
        };

        Finding memberB = new()
        {
            FindingId = "FIND-B",
            FindingType = "PolicyViolation",
            Category = "Security",
            EngineType = "engine-b",
            Title = "b",
            Rationale = "b",
            Severity = FindingSeverity.Critical,
        };

        Finding conflict = new()
        {
            FindingId = conflictId,
            FindingType = "FindingMergeConflict",
            Category = "Security",
            EngineType = "finding-merge-conflict",
            Title = "conflict",
            Rationale =
                "Finding merge conflict on ADR 0063 key. EngineTypes=[engine-a, engine-b]; FindingIds=[find-a, find-b]",
            Severity = FindingSeverity.Warning,
        };

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = snapshotId,
            RunId = runId,
            Findings = [memberA, memberB, conflict],
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId, FindingsSnapshotId = snapshotId });

        FindingsSnapshot? saved = null;
        Mock<IFindingsSnapshotRepository> snapshots = new();
        snapshots
            .Setup(s => s.GetByIdAsync(Scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        snapshots
            .Setup(s => s.SaveAsync(
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Callback<FindingsSnapshot, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (value, _, _, _) => saved = value)
            .Returns(Task.CompletedTask);

        FindingMergeConflictResolutionService sut = new(runs.Object, snapshots.Object);

        bool resolved = await sut.TryResolveAsync(
            Scope,
            runId,
            conflictId,
            FindingMergeConflictResolutionAction.AcceptPrimary,
            CancellationToken.None);

        resolved.Should().BeTrue();
        saved.Should().NotBeNull();
        saved!.Findings.Should().ContainSingle();
        saved.Findings[0].FindingId.Should().Be("FIND-A");
    }
}
