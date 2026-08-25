using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunRepositoryCoreTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-0000-0000-0000-000000000003");

    [Fact]
    public void ValidateRunKeysetCursor_rejects_partial_cursor()
    {
        Action act = () => RunRepositoryCore.ValidateRunKeysetCursor(DateTime.UtcNow, null);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ClampPurgeBatchSize_clamps_to_maximum()
    {
        RunRepositoryCore.ClampPurgeBatchSize(50_000).Should().Be(RunRepositoryCore.MaxPurgeBatchSize);
    }

    [Fact]
    public void ClampPurgeBatchSize_rejects_zero()
    {
        Action act = () => RunRepositoryCore.ClampPurgeBatchSize(0);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void IsCommittedRun_recognizes_manifest_and_status_signals()
    {
        RunRepositoryCore.IsCommittedRun(new RunRecord { LegacyRunStatus = nameof(ArchitectureRunStatus.Committed) })
            .Should().BeTrue();

        RunRepositoryCore.IsCommittedRun(new RunRecord { CurrentManifestVersion = "v1" })
            .Should().BeTrue();

        RunRepositoryCore.IsCommittedRun(new RunRecord { GoldenManifestId = Guid.NewGuid() })
            .Should().BeTrue();

        RunRepositoryCore.IsCommittedRun(new RunRecord()).Should().BeFalse();
    }

    [Fact]
    public void LegacyRunStatusIsNonTerminal_treats_empty_as_active()
    {
        RunRepositoryCore.LegacyRunStatusIsNonTerminal(null).Should().BeTrue();
        RunRepositoryCore.LegacyRunStatusIsNonTerminal(nameof(ArchitectureRunStatus.Committed)).Should().BeFalse();
        RunRepositoryCore.LegacyRunStatusIsNonTerminal(nameof(ArchitectureRunStatus.Failed)).Should().BeFalse();
        RunRepositoryCore.LegacyRunStatusIsNonTerminal(nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected))
            .Should().BeFalse();
        RunRepositoryCore.LegacyRunStatusIsNonTerminal(nameof(ArchitectureRunStatus.WaitingForResults)).Should().BeTrue();
    }

    [Fact]
    public void SelectLatestWithGraphAtOrBefore_picks_latest_graph_before_cutoff()
    {
        ScopeContext scope = Scope(TenantId, WorkspaceId, ProjectId);
        DateTime asOf = new(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid olderRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid newerRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");

        RunRecord? selected = RunRepositoryCore.SelectLatestWithGraphAtOrBefore(
            [
                Run(scope, olderRunId, createdUtc: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), graphSnapshotId: Guid.NewGuid()),
                Run(scope, newerRunId, createdUtc: new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc), graphSnapshotId: Guid.NewGuid()),
                Run(scope, Guid.NewGuid(), createdUtc: new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc), graphSnapshotId: Guid.NewGuid()),
            ],
            scope,
            "project-slug",
            asOf);

        selected!.RunId.Should().Be(newerRunId);
    }

    [Fact]
    public void SelectLatestCommittedRunIdByManifestCreatedUtc_uses_completed_utc_ordering()
    {
        ScopeContext scope = Scope(TenantId, WorkspaceId, ProjectId);
        Guid firstRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid secondRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");

        Guid? selected = RunRepositoryCore.SelectLatestCommittedRunIdByManifestCreatedUtc(
            [
                CommittedRun(scope, firstRunId, createdUtc: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), completedUtc: new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc)),
                CommittedRun(scope, secondRunId, createdUtc: new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc), completedUtc: new DateTime(2026, 1, 4, 0, 0, 0, DateTimeKind.Utc)),
            ],
            scope,
            "project-slug");

        selected.Should().Be(secondRunId);
    }

    [Fact]
    public void IsEligibleForCreatedBeforeArchive_respects_scope()
    {
        ScopeContext scope = Scope(TenantId, WorkspaceId, ProjectId);
        RunRecord inScope = Run(scope, Guid.NewGuid(), createdUtc: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        RunRecord outOfScope = Run(Scope(Guid.NewGuid(), WorkspaceId, ProjectId), Guid.NewGuid(), createdUtc: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));

        RunRepositoryCore.IsEligibleForCreatedBeforeArchive(inScope, new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc), scope)
            .Should().BeTrue();
        RunRepositoryCore.IsEligibleForCreatedBeforeArchive(outOfScope, new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc), scope)
            .Should().BeFalse();
    }

    [Fact]
    public void ToArchivedRunScopeRow_copies_scope_columns()
    {
        RunRecord run = Run(Scope(TenantId, WorkspaceId, ProjectId), Guid.NewGuid(), createdUtc: DateTime.UtcNow);

        ArchivedRunScopeRow row = RunRepositoryCore.ToArchivedRunScopeRow(run);

        row.RunId.Should().Be(run.RunId);
        row.TenantId.Should().Be(run.TenantId);
        row.WorkspaceId.Should().Be(run.WorkspaceId);
        row.ScopeProjectId.Should().Be(run.ScopeProjectId);
    }

    private static ScopeContext Scope(Guid tenantId, Guid workspaceId, Guid projectId) =>
        new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

    private static RunRecord Run(
        ScopeContext scope,
        Guid runId,
        DateTime createdUtc,
        Guid? graphSnapshotId = null) =>
        new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "project-slug",
            CreatedUtc = createdUtc,
            GraphSnapshotId = graphSnapshotId,
        };

    private static RunRecord CommittedRun(
        ScopeContext scope,
        Guid runId,
        DateTime createdUtc,
        DateTime completedUtc) =>
        new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "project-slug",
            CreatedUtc = createdUtc,
            CompletedUtc = completedUtc,
            GoldenManifestId = Guid.NewGuid(),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
        };
}
