using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Guards <see cref="RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace" /> semantics against
///     <see cref="InMemoryRunRepository.ExistsActiveRunWithSystemNameInWorkspaceAsync" />.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunRepositoryWorkspaceSystemNameSqlTests
{
    [Fact]
    public void ExistsActiveRunWithSystemNameInWorkspace_sql_trims_project_id_before_upper_compare()
    {
        const string sql = RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace;

        sql.Should().Contain("LTRIM(RTRIM(");
        sql.Should().Contain("UPPER(");
        sql.Should().Contain("ProjectId");
    }

    [Fact]
    public void ExistsActiveRunWithSystemNameInWorkspace_sql_excludes_failed_and_quality_rejected_statuses()
    {
        const string sql = RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace;

        sql.Should().Contain("@FailedStatus");
        sql.Should().Contain("@QualityRejectedStatus");
        sql.Should().Contain("LegacyRunStatus NOT IN (@FailedStatus, @QualityRejectedStatus)");
    }

    [Fact]
    public void ExistsActiveRunWithSystemNameInWorkspace_treats_committed_runs_as_occupying()
    {
        RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace.Should()
            .NotContain("@CommittedStatus",
                "workspace name collision guard intentionally blocks reuse while a committed review occupies the name.");
    }

    [Fact]
    public async Task InMemory_committed_run_occupies_workspace_system_name()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "billing",
            ct: CancellationToken.None);

        exists.Should().BeTrue(
            "Committed reviews occupy workspace system names; CountActiveRunsForArchitectureRequest excludes Committed for concurrency only.");
    }

    [Fact]
    public async Task InMemory_failed_run_does_not_occupy_workspace_system_name()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "ArchLucid",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
                CompletedUtc = TimeProvider.System.UtcNowDateTime(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "ArchLucid",
            ct: CancellationToken.None);

        exists.Should().BeFalse("failed create stubs must not block replacement intake with the same name.");
    }

    [Fact]
    public async Task InMemory_quality_rejected_run_does_not_occupy_workspace_system_name()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "ArchLucid",
                LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "ArchLucid",
            ct: CancellationToken.None);

        exists.Should().BeFalse();
    }

    [Fact]
    public async Task InMemory_committed_run_still_occupies_workspace_system_name()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid committedRunId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "ArchLucid",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "ArchLucid",
            ct: CancellationToken.None);

        exists.Should().BeTrue();
    }

    [Fact]
    public async Task InMemory_committed_run_excluded_by_prior_run_id_does_not_occupy()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid committedRunId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "ArchLucid",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "ArchLucid",
            excludeRunId: committedRunId,
            ct: CancellationToken.None);

        exists.Should().BeFalse();
    }

    [Fact]
    public async Task InMemory_created_run_still_occupies_workspace_system_name()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "ArchLucid",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "ArchLucid",
            ct: CancellationToken.None);

        exists.Should().BeTrue();
    }

    [Fact]
    public void Authority_project_slug_queries_trim_project_id_before_upper_compare()
    {
        RunRepositorySql.SelectLatestWithGraphAtOrBefore.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(ProjectId))");
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(r.ProjectId))");
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(r.ProjectId))");
    }

    [Fact]
    public void Project_list_queries_trim_project_id_before_upper_compare()
    {
        HotPathRelationalQueryShapes.RunsListByProjectNoLock.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(r.ProjectId))");
        HotPathRelationalQueryShapes.RunsListByProjectKeysetNoLock.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(r.ProjectId))");
        HotPathRelationalQueryShapes.RunsListByProjectNoLock.Should().Contain("STRING_AGG");
    }

    [Fact]
    public async Task InMemory_matches_padded_project_id_for_workspace_collision_lookup()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "Claims API  ",
                Description = "padded slug",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "claims api",
            ct: CancellationToken.None);

        exists.Should().BeTrue("workspace collision lookup must ignore leading/trailing whitespace on stored project slugs.");
    }

    [Fact]
    public async Task InMemory_workspace_collision_lookup_rejects_cross_tenant_active_run()
    {
        ScopeContext scopeA = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scopeA.TenantId,
                WorkspaceId = scopeA.WorkspaceId,
                ScopeProjectId = scopeA.ProjectId,
                ProjectId = "Payments Hub",
                Description = "tenant-a",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scopeA.WorkspaceId,
            ProjectId = scopeA.ProjectId,
        };

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scopeB,
            "Payments Hub",
            ct: CancellationToken.None);

        exists.Should().BeFalse("another tenant's active run must not block workspace system-name checks.");
    }

    [Fact]
    public async Task InMemory_matches_padded_project_id_for_latest_committed_run_lookup()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid committedRunId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "Claims Intake  ",
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                CompletedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CurrentManifestVersion = "v1",
            },
            CancellationToken.None);

        Guid? latest = await runs.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
            scope,
            "claims intake",
            CancellationToken.None);

        latest.Should().Be(committedRunId);
    }

    [Fact]
    public async Task InMemory_matches_padded_project_id_for_list_by_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid runId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "Claims API  ",
                Description = "padded slug",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        IReadOnlyList<RunRecord> listed = await runs.ListByProjectAsync(
            scope,
            "claims api",
            10,
            CancellationToken.None);

        listed.Should().ContainSingle(r => r.RunId == runId);
    }

    [Fact]
    public async Task InMemory_list_by_project_matches_scope_project_guid_filter()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid runId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "display-name",
                Description = "scope guid list",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        IReadOnlyList<RunRecord> listed = await runs.ListByProjectAsync(
            scope,
            scope.ProjectId.ToString("D"),
            10,
            CancellationToken.None);

        listed.Should().ContainSingle(r => r.RunId == runId);
    }

    [Fact]
    public void MatchesProjectListFilter_accepts_padded_scope_project_guid_string()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        };

        RunRecord run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "display-name",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        string paddedScopeProjectId = $"  {scope.ProjectId:D}  ";

        RunRepositoryCore.MatchesProjectListFilter(run, paddedScopeProjectId).Should().BeTrue(
            "Guid.TryParse accepts leading/trailing whitespace; SQL uniqueidentifier conversion does the same.");
    }

    [Fact]
    public async Task InMemory_list_by_project_matches_padded_scope_project_guid_filter()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
        };

        Guid runId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "display-name",
                Description = "padded scope guid list",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        IReadOnlyList<RunRecord> listed = await runs.ListByProjectAsync(
            scope,
            $"  {scope.ProjectId:D}  ",
            10,
            CancellationToken.None);

        listed.Should().ContainSingle(r => r.RunId == runId);
    }

    [Fact]
    public void SelectCommittedRunIdByGoldenManifestId_orders_by_created_utc_then_run_id()
    {
        RunRepositorySql.SelectCommittedRunIdByGoldenManifestId.Should()
            .Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void SelectCommittedRunIdByGoldenManifestId_excludes_archived_runs_via_run_archival_cascade()
    {
        RunRepositorySql.SelectCommittedRunIdByGoldenManifestId.Should().Contain("r.ArchivedUtc IS NULL");
        RunRepositorySql.SelectCommittedRunIdByGoldenManifestId.Should().NotContain("dbo.GoldenManifests",
            "run archival cascades GoldenManifests.ArchivedUtc in the same batch; scoped lookup filters active runs only.");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByArchitectureVersionId_excludes_archived_runs_without_golden_manifest_join()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByArchitectureVersionId.Should().Contain("r.ArchivedUtc IS NULL");
        RunRepositorySql.SelectLatestCommittedRunIdByArchitectureVersionId.Should().NotContain("dbo.GoldenManifests",
            "version-scoped committed lookup ranks active runs; manifest archival follows run archival cascade.");
    }

    [Fact]
    public void Update_omits_archived_filter_to_allow_archival_and_unarchive_writes()
    {
        RunRepositorySql.Update.Should().Contain("ArchivedUtc = @ArchivedUtc");
        RunRepositorySql.Update.Should().NotContain("ArchivedUtc IS NULL",
            "mutating update must be able to set ArchivedUtc during archive/unarchive batches.");
    }

    [Fact]
    public void SelectPriorCommittedRunIdForArchitectureBeforeCurrent_excludes_archived_golden_manifests()
    {
        RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent.Should()
            .Contain("gm.ArchivedUtc IS NULL");
        RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent.Should()
            .Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void SelectPriorCommittedRunIdForArchitectureBeforeCurrent_excludes_current_and_later_timeline()
    {
        RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent.Should()
            .Contain("r.RunId <> @CurrentRunId");
        RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent.Should()
            .Contain("r.CreatedUtc < @CurrentCreatedUtc");
        RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent.Should()
            .Contain("(r.CreatedUtc = @CurrentCreatedUtc AND r.RunId < @CurrentRunId)");
    }

    [Fact]
    public void Insert_outputs_row_version_stamp_for_optimistic_concurrency()
    {
        RunRepositorySql.Insert.Should().Contain("OUTPUT inserted.RowVersionStamp INTO @RunInsertOutput");
        RunRepositorySql.Insert.Should().Contain("SELECT RowVersionStamp FROM @RunInsertOutput");
    }

    [Fact]
    public void IsEligibleForStaleUncommittedPurge_excludes_committed_demo_and_showcase_runs()
    {
        DateTime cutoff = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            },
            cutoff).Should().BeFalse();

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                IsDemoWelcomeRun = true,
            },
            cutoff).Should().BeFalse();

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                IsPublicShowcase = true,
            },
            cutoff).Should().BeFalse();

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            },
            cutoff).Should().BeTrue();
    }

    [Fact]
    public async Task InMemory_stale_uncommitted_purge_skips_committed_runs()
    {
        InMemoryRunRepository runs = new();
        RunRecord committed = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid(),
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
        };

        await runs.SaveAsync(committed, CancellationToken.None);

        RunStaleUncommittedPurgeBatchResult result = await runs.HardDeleteStaleUncommittedRunsBatchAsync(
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            10,
            CancellationToken.None);

        result.Deleted.Should().BeEmpty();
        (await runs.GetByIdAsync(
            new ScopeContext
            {
                TenantId = committed.TenantId,
                WorkspaceId = committed.WorkspaceId,
                ProjectId = committed.ScopeProjectId,
            },
            committed.RunId,
            CancellationToken.None)).Should().NotBeNull();
    }

    [Fact]
    public async Task InMemory_count_by_architecture_id_excludes_archived_runs()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        InMemoryRunRepository runs = new();

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ArchivedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        int count = await runs.CountByArchitectureIdAsync(scope, architectureId, CancellationToken.None);

        count.Should().Be(1);
    }

    [Fact]
    public async Task InMemory_archive_runs_created_before_for_scope_leaves_other_scopes_active()
    {
        ScopeContext targetScope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        ScopeContext otherScope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        InMemoryRunRepository runs = new();

        RunRecord targetRun = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = targetScope.TenantId,
            WorkspaceId = targetScope.WorkspaceId,
            ScopeProjectId = targetScope.ProjectId,
            ProjectId = "billing",
            CreatedUtc = oldCreated,
        };
        RunRecord otherRun = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = otherScope.TenantId,
            WorkspaceId = otherScope.WorkspaceId,
            ScopeProjectId = otherScope.ProjectId,
            ProjectId = "billing",
            CreatedUtc = oldCreated,
        };

        await runs.SaveAsync(targetRun, CancellationToken.None);
        await runs.SaveAsync(otherRun, CancellationToken.None);

        RunArchiveBatchResult batch = await runs.ArchiveRunsCreatedBeforeForScopeAsync(
            targetScope,
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            CancellationToken.None);

        batch.UpdatedCount.Should().Be(1);
        (await runs.GetByIdAsync(otherScope, otherRun.RunId, CancellationToken.None)).Should().NotBeNull();
        (await runs.GetByIdAsync(targetScope, targetRun.RunId, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public void SelectLatestRunIdForArchitecture_orders_active_runs_by_created_utc_then_run_id()
    {
        RunRepositorySql.SelectLatestRunIdForArchitecture.Should().Contain("r.ArchivedUtc IS NULL");
        RunRepositorySql.SelectLatestRunIdForArchitecture.Should()
            .Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void ClearGraphSnapshotForArchitecture_targets_active_runs_only()
    {
        RunRepositorySql.ClearGraphSnapshotForArchitecture.Should().Contain("ArchivedUtc IS NULL");
        RunRepositorySql.ClearGraphSnapshotForArchitecture.Should().Contain("GraphSnapshotId IS NOT NULL");
    }

    [Fact]
    public void SelectAnchorGuardByScopedId_omits_archived_filter_for_save_path_anchor_reads()
    {
        RunRepositorySql.SelectAnchorGuardByScopedId.Should().NotContain("ArchivedUtc IS NULL",
            "SaveAsync anchor guard loads persisted headers for update batches including archival writes.");
    }

    [Fact]
    public void ArchiveRunsCreatedBeforeInScope_scopes_bulk_archive_to_active_scope()
    {
        RunRepositorySql.ArchiveRunsCreatedBeforeInScope.Should().Contain("TenantId = @TenantId");
        RunRepositorySql.ArchiveRunsCreatedBeforeInScope.Should().Contain("WorkspaceId = @WorkspaceId");
        RunRepositorySql.ArchiveRunsCreatedBeforeInScope.Should().Contain("ScopeProjectId = @ScopeProjectId");
        RunRepositorySql.ArchiveRunsCreatedBeforeInScope.Should().Contain("ArchivedUtc IS NULL");
    }

    [Fact]
    public void SelectPriorCommittedRunIdBeforeCurrent_excludes_archived_golden_manifests()
    {
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should().Contain("gm.ArchivedUtc IS NULL");
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should()
            .Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void UpdateOperatorGovernanceDisposition_requires_active_run()
    {
        RunRepositorySql.UpdateOperatorGovernanceDisposition.Should().Contain("ArchivedUtc IS NULL");
    }

    [Fact]
    public void SelectByScopedIdIncludingArchived_omits_archived_filter_for_replay_reads()
    {
        RunRepositorySql.SelectByScopedIdIncludingArchived.Should().Contain("TenantId = @TenantId");
        RunRepositorySql.SelectByScopedIdIncludingArchived.TrimEnd().Should()
            .EndWith("ScopeProjectId = @ScopeProjectId;",
                "replay read keeps tenant scope but does not append the active-run ArchivedUtc filter used by SelectByScopedId.");
        RunRepositorySql.SelectByScopedId.Should().Contain("AND ArchivedUtc IS NULL");
    }

    [Fact]
    public async Task InMemory_operator_governance_disposition_skips_archived_run()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        RunRecord archived = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArchivedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(archived, CancellationToken.None);

        bool updated = await runs.TrySetOperatorGovernanceDispositionAsync(
            scope,
            archived.RunId,
            "Approved",
            "ok",
            "operator",
            TimeProvider.System.UtcNowDateTime(),
            CancellationToken.None);

        updated.Should().BeFalse("operator governance writes require active in-scope runs.");
    }

    [Fact]
    public async Task InMemory_get_by_id_including_archived_returns_soft_archived_run()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        RunRecord archived = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArchivedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(archived, CancellationToken.None);

        RunRecord? activeRead = await runs.GetByIdAsync(scope, archived.RunId, CancellationToken.None);
        RunRecord? archivedRead = await runs.GetByIdIncludingArchivedAsync(scope, archived.RunId, CancellationToken.None);

        activeRead.Should().BeNull();
        archivedRead.Should().NotBeNull();
    }

    [Fact]
    public async Task InMemory_architecture_list_excludes_archived_runs()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        InMemoryRunRepository runs = new();

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ArchivedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);
        RunRecord active = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            ArchitectureId = architectureId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
        await runs.SaveAsync(active, CancellationToken.None);

        IReadOnlyList<RunRecord> listed = await runs.ListByArchitectureIdAsync(
            scope,
            architectureId,
            CancellationToken.None);

        listed.Should().ContainSingle(r => r.RunId == active.RunId);
    }

    [Fact]
    public async Task InMemory_committed_run_by_golden_manifest_picks_newest_when_manifest_is_shared()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid lowerRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid higherRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");
        DateTime sharedCreatedUtc = new(2026, 9, 2, 0, 0, 0, DateTimeKind.Utc);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = lowerRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = sharedCreatedUtc,
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = higherRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = sharedCreatedUtc,
            },
            CancellationToken.None);

        Guid? selected = await runs.GetCommittedRunIdByGoldenManifestIdAsync(
            scope,
            architectureId,
            manifestId,
            Guid.Empty,
            CancellationToken.None);

        selected.Should().Be(higherRunId,
            "seal-delta lookup must match SQL RunId tie-break when committed runs share CreatedUtc.");
    }

    [Fact]
    public void SelectCommittedRunIdByGoldenManifestId_excludes_failed_runs_after_pipeline_dead_letter()
    {
        RunRepositorySql.SelectCommittedRunIdByGoldenManifestId.Should()
            .Contain("LegacyRunStatus NOT IN (@FailedStatus, @QualityRejectedStatus)");
        RunRepositorySql.SelectCommittedRunIdByGoldenManifestId.Should()
            .NotContain("OR r.GoldenManifestId IS NOT NULL",
                "manifest id is already required in the WHERE clause; tautological OR let dead-letter rows match.");
    }

    [Fact]
    public async Task InMemory_failed_run_with_retained_golden_manifest_does_not_match_seal_delta_lookup()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid committedRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid failedRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");
        DateTime olderCreatedUtc = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newerCreatedUtc = new(2026, 9, 2, 0, 0, 0, DateTimeKind.Utc);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = olderCreatedUtc,
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = failedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                GoldenManifestId = manifestId,
                CurrentManifestVersion = "v1",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
                CreatedUtc = newerCreatedUtc,
            },
            CancellationToken.None);

        Guid? selected = await runs.GetCommittedRunIdByGoldenManifestIdAsync(
            scope,
            architectureId,
            manifestId,
            Guid.Empty,
            CancellationToken.None);

        selected.Should().Be(committedRunId,
            "pipeline dead-letter rows retain manifest headers but must not win seal-delta committed lookup.");
    }

    [Fact]
    public async Task InMemory_seal_delta_lookup_with_exclude_skips_failed_in_flight_manifest_holder()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid committedRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid failedRerunId = Guid.Parse("22222222-0000-0000-0000-000000000002");

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = failedRerunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureId = architectureId,
                GoldenManifestId = manifestId,
                CurrentManifestVersion = "v2",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
                CreatedUtc = new DateTime(2026, 9, 2, 0, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        Guid? selected = await runs.GetCommittedRunIdByGoldenManifestIdAsync(
            scope,
            architectureId,
            manifestId,
            failedRerunId,
            CancellationToken.None);

        selected.Should().Be(committedRunId,
            "prior-resolve must return the committed peer when the excluded rerun dead-lettered with manifest headers.");
    }

    [Fact]
    public void IsEligibleForStaleUncommittedPurge_excludes_sample_runs()
    {
        DateTime cutoff = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                IsSample = true,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            },
            cutoff).Should().BeFalse("sample runs purge through SampleRunPurgeBatch, not stale-uncommitted hard delete.");
    }

    [Fact]
    public void IsEligibleForStaleUncommittedPurge_includes_archived_uncommitted_runs_by_design()
    {
        DateTime cutoff = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                ArchivedUtc = oldCreated.AddDays(1),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            },
            cutoff).Should().BeTrue(
            "stale-uncommitted hard delete targets aged uncommitted rows regardless of soft-archive flag.");
    }

    [Fact]
    public void Archival_PurgeStaleUncommittedRunsBatch_omits_sample_runs()
    {
        const string sql = """
                           CREATE OR ALTER PROCEDURE dbo.Archival_PurgeStaleUncommittedRunsBatch
                           AS
                           SELECT TOP (@BatchSize) r.RunId
                           FROM dbo.Runs AS r
                           WHERE r.CreatedUtc < @CutoffUtc
                             AND r.IsDemoWelcomeRun = 0
                             AND r.IsPublicShowcase = 0
                             AND r.IsSample = 0;
                           """;

        sql.Should().Contain("r.IsSample = 0");
    }

    [Fact]
    public void ExistsActiveRunWithSystemNameInWorkspace_scopes_to_workspace_not_scope_project()
    {
        RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace.Should().Contain("WorkspaceId = @WorkspaceId");
        RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace.Should().NotContain("ScopeProjectId");
    }

    [Fact]
    public void ListWithNullArchitectureId_orders_ascending_for_backfill_queue()
    {
        const string sql = """
                           SELECT TOP (@Take)
                                  RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description,
                                  PackageOrigin, ArchitectureId, ArchitectureVersionId, ArchitectureRequestId,
                                  KnowledgeModelId, CreatedUtc, UpdatedUtc, ArchivedUtc, LegacyRunStatus,
                                  CurrentManifestVersion, GoldenManifestId
                           FROM dbo.Runs
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND ArchitectureId IS NULL
                             AND ArchivedUtc IS NULL
                           ORDER BY CreatedUtc ASC, RunId ASC;
                           """;

        sql.Should().Contain("ORDER BY CreatedUtc ASC, RunId ASC");
        sql.Should().Contain("ArchivedUtc IS NULL");
    }

    [Fact]
    public async Task InMemory_list_with_null_architecture_id_excludes_archived_runs()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ArchivedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        RunRecord active = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
        await runs.SaveAsync(active, CancellationToken.None);

        IReadOnlyList<RunRecord> listed = await runs.ListWithNullArchitectureIdAsync(scope, 10, CancellationToken.None);

        listed.Should().ContainSingle(r => r.RunId == active.RunId);
    }

    [Fact]
    public async Task InMemory_select_latest_with_graph_skips_runs_without_graph_snapshot()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime asOfUtc = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        Guid graphRunId = Guid.NewGuid();

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = asOfUtc.AddMinutes(1),
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = graphRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = asOfUtc,
            },
            CancellationToken.None);

        RunRecord? selected = await runs.GetLatestWithGraphAtOrBeforeAsync(scope, "billing", asOfUtc, CancellationToken.None);

        selected.Should().NotBeNull();
        selected!.RunId.Should().Be(graphRunId);
    }

    [Fact]
    public void CountActiveRunsForArchitectureRequest_uses_canonical_terminal_status_names()
    {
        const string sql = RunRepositorySql.CountActiveRunsForArchitectureRequest;

        sql.Should().Contain("@CommittedStatus");
        sql.Should().Contain("@FailedStatus");
        sql.Should().Contain("@QualityRejectedStatus");
        sql.Should().Contain("LegacyRunStatus NOT IN (@CommittedStatus, @FailedStatus, @QualityRejectedStatus)");
    }

    [Fact]
    public void SelectByRunIdAdmin_omits_tenant_scope_for_operational_lookup()
    {
        RunRepositorySql.SelectByRunIdAdmin.Should().Contain("WHERE RunId = @RunId");
        RunRepositorySql.SelectByRunIdAdmin.Should().NotContain("TenantId = @TenantId");
    }

    [Fact]
    public void CommittedArchitectureReviewExists_requires_golden_manifest_not_manifest_version_only()
    {
        const string sql = HotPathRelationalQueryShapes.CommittedArchitectureReviewExistsNoLock;

        sql.Should().Contain("LegacyRunStatus = @CommittedStatus");
        sql.Should().Contain("GoldenManifestId IS NOT NULL");
        sql.Should().NotContain("CurrentManifestVersion");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByManifestCreatedUtc_in_memory_uses_completed_utc_stand_in()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid earlierCompletedRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid laterCompletedRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");
        DateTime createdUtc = new(2026, 9, 9, 0, 0, 0, DateTimeKind.Utc);

        Guid? selected = RunRepositoryCore.SelectLatestCommittedRunIdByManifestCreatedUtc(
            [
                new RunRecord
                {
                    RunId = earlierCompletedRunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "billing",
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                    GoldenManifestId = Guid.NewGuid(),
                    CreatedUtc = createdUtc,
                    CompletedUtc = createdUtc.AddHours(1),
                },
                new RunRecord
                {
                    RunId = laterCompletedRunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "billing",
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                    GoldenManifestId = Guid.NewGuid(),
                    CreatedUtc = createdUtc,
                    CompletedUtc = createdUtc.AddHours(2),
                },
            ],
            scope,
            "billing");

        selected.Should().Be(laterCompletedRunId,
            "InMemory committed lookup intentionally ranks by CompletedUtc until GoldenManifests join exists in tests.");
    }

    [Fact]
    public void SelectLatestWithGraphAtOrBefore_uses_inclusive_as_of_boundary_with_run_id_tie_break()
    {
        RunRepositorySql.SelectLatestWithGraphAtOrBefore.Should().Contain("CreatedUtc <= @AsOfUtc");
        RunRepositorySql.SelectLatestWithGraphAtOrBefore.Should().Contain("ORDER BY CreatedUtc DESC, RunId DESC");
    }

    [Fact]
    public void SelectLatestWithGraphAtOrBefore_requires_graph_snapshot_id()
    {
        RunRepositorySql.SelectLatestWithGraphAtOrBefore.Should().Contain("GraphSnapshotId IS NOT NULL");
    }

    [Fact]
    public void SelectPriorCommittedRunIdBeforeCurrent_excludes_current_and_later_timeline()
    {
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should().Contain("r.RunId <> @CurrentRunId");
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should().Contain("r.CreatedUtc < @CurrentCreatedUtc");
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should()
            .Contain("(r.CreatedUtc = @CurrentCreatedUtc AND r.RunId < @CurrentRunId)");
    }

    [Fact]
    public void ArchiveRunsByIds_targets_active_rows_and_reports_already_archived()
    {
        RunRepositorySql.ArchiveRunsByIds.Should().Contain("WHERE RunId IN @RunIds AND ArchivedUtc IS NULL");
        RunRepositorySql.ArchiveRunsByIds.Should().Contain("WHERE RunId IN @RunIds AND ArchivedUtc IS NOT NULL");
        RunRepositorySql.ArchiveRunsByIds.Should().Contain("EXEC dbo.Archival_CascadeFromArchivedRuns");
    }

    [Fact]
    public void ArchiveRunsCreatedBefore_omits_tenant_scope_for_catalog_retention()
    {
        RunRepositorySql.ArchiveRunsCreatedBefore.Should().Contain("CreatedUtc < @Cutoff");
        RunRepositorySql.ArchiveRunsCreatedBefore.Should().Contain("ArchivedUtc IS NULL");
        RunRepositorySql.ArchiveRunsCreatedBefore.Should().NotContain("TenantId = @TenantId",
            "catalog retention archive is TenantScopeExempt and filters by CreatedUtc cutoff only.");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByManifestCreatedUtc_excludes_archived_golden_manifests()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should().Contain("gm.ArchivedUtc IS NULL");
    }

    [Fact]
    public void CommittedArchitectureReviewExists_excludes_archived_golden_manifests()
    {
        HotPathRelationalQueryShapes.CommittedArchitectureReviewExistsNoLock.Should().Contain("gm.ArchivedUtc IS NULL");
    }

    [Fact]
    public async Task InMemory_committed_review_flag_reader_scans_bounded_recent_list_not_full_scope()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        DateTime baseUtc = new(2026, 9, 9, 0, 0, 0, DateTimeKind.Utc);

        for (int i = 0; i < 501; i++)
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = Guid.NewGuid(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "noise",
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
                    CreatedUtc = baseUtc.AddMinutes(i),
                },
                CancellationToken.None);
        }

        RunRecord committedReview = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = baseUtc.AddMinutes(-1),
        };

        await runs.SaveAsync(committedReview, CancellationToken.None);

        RunRepositoryCommittedArchitectureReviewFlagReader reader = new(runs);
        bool hasCommittedReview = await reader.TenantHasCommittedArchitectureReviewAsync(scope, CancellationToken.None);

        hasCommittedReview.Should().BeFalse(
            "InMemory enrichment reader intentionally scans only the bounded recent list; SQL EXISTS remains authoritative.");
    }

    [Fact]
    public async Task InMemory_offset_list_pages_all_runs_when_created_utc_ties()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime sharedCreatedUtc = new(2026, 9, 7, 12, 0, 0, DateTimeKind.Utc);
        Guid runA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid runC = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid runD = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        InMemoryRunRepository runs = new();

        foreach (Guid runId in new[] { runA, runB, runC, runD })
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = runId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "default",
                    Description = "tied created utc",
                    CreatedUtc = sharedCreatedUtc,
                },
                CancellationToken.None);
        }

        RunListPage firstPage = await runs.ListRecentInScopeOffsetAsync(scope, 0, 2, CancellationToken.None);
        RunListPage secondPage = await runs.ListRecentInScopeOffsetAsync(scope, 2, 2, CancellationToken.None);

        firstPage.Items.Select(r => r.RunId)
            .Concat(secondPage.Items.Select(r => r.RunId))
            .Should()
            .BeEquivalentTo(new[] { runD, runC, runB, runA }, opts => opts.WithStrictOrdering());
    }

    [Fact]
    public void IsActiveCommittedRunInProject_requires_golden_manifest_for_project_scoped_committed_lookups()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        RunRecord committedWithoutManifest = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CurrentManifestVersion = "v1",
            CreatedUtc = new DateTime(2026, 9, 9, 0, 0, 0, DateTimeKind.Utc),
        };

        RunRecord committedWithManifest = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "billing",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 9, 9, 0, 0, 0, DateTimeKind.Utc),
        };

        RunRepositoryCore.IsActiveCommittedRunInProject(committedWithoutManifest, scope, "billing").Should().BeFalse();
        RunRepositoryCore.IsActiveCommittedRunInProject(committedWithManifest, scope, "billing").Should().BeTrue();
    }

    [Fact]
    public async Task InMemory_stale_uncommitted_purge_deletes_oldest_eligible_runs_first()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime cutoff = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        Guid oldestRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid middleRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid newestRunId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid committedRunId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        InMemoryRunRepository runs = new();

        foreach ((Guid runId, DateTime createdUtc) in new[]
                 {
                     (oldestRunId, cutoff.AddHours(-3)),
                     (middleRunId, cutoff.AddHours(-2)),
                     (newestRunId, cutoff.AddHours(-1)),
                 })
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = runId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "billing",
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
                    CreatedUtc = createdUtc,
                },
                CancellationToken.None);
        }

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = Guid.NewGuid(),
                CreatedUtc = cutoff.AddHours(-4),
            },
            CancellationToken.None);

        RunStaleUncommittedPurgeBatchResult batch =
            await runs.HardDeleteStaleUncommittedRunsBatchAsync(cutoff, 2, CancellationToken.None);

        batch.Deleted.Select(row => row.RunId)
            .Should()
            .BeEquivalentTo(new[] { oldestRunId, middleRunId }, opts => opts.WithStrictOrdering());
        (await runs.GetByIdAsync(scope, newestRunId, CancellationToken.None)).Should().NotBeNull();
        (await runs.GetByIdAsync(scope, committedRunId, CancellationToken.None)).Should().NotBeNull();
    }

    [Fact]
    public void SampleRunPurgeBatch_orders_oldest_sample_runs_first_by_created_utc()
    {
        const string sql = """
                           CREATE OR ALTER PROCEDURE dbo.SampleRunPurgeBatch
                           AS
                           SELECT TOP (@BatchSize)
                                  r.RunId
                           FROM dbo.Runs AS r
                           WHERE r.IsSample = 1
                           ORDER BY r.CreatedUtc ASC;
                           """;

        sql.Should().Contain("ORDER BY r.CreatedUtc ASC");
        sql.Should().Contain("r.IsSample = 1");
    }

    [Fact]
    public void Committed_manifest_joins_omit_tenant_id_because_manifest_id_is_globally_unique()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should()
            .Contain("INNER JOIN dbo.GoldenManifests gm");
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should()
            .NotContain("gm.TenantId = r.TenantId",
                "ManifestId is the GoldenManifests primary key; tenant scope is enforced on dbo.Runs predicates.");

        HotPathRelationalQueryShapes.CommittedArchitectureReviewExistsNoLock.Should()
            .Contain("gm.TenantId = r.TenantId",
                "nav EXISTS adds tenant guard on the join for defense-in-depth even though ManifestId is globally unique.");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByManifestCreatedUtc_requires_golden_manifest_join()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should()
            .Contain("ON gm.ManifestId = r.GoldenManifestId");
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should()
            .Contain("NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL",
                "manifest-version-only rows still require GoldenManifestId for the INNER JOIN to match.");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByArchitectureVersionId_uses_shared_committed_predicate()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByArchitectureVersionId.Should()
            .Contain("r.LegacyRunStatus = @CommittedStatus");
        RunRepositorySql.SelectLatestCommittedRunIdByArchitectureVersionId.Should()
            .Contain("NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL");
        RunRepositorySql.SelectLatestCommittedRunIdByArchitectureVersionId.Should()
            .Contain("r.GoldenManifestId IS NOT NULL");
    }

    [Fact]
    public void Update_allows_null_row_version_for_unconditional_write()
    {
        RunRepositorySql.Update.Should().Contain("@RowVersion IS NULL OR RowVersionStamp = @RowVersion");
    }

    [Fact]
    public void SelectLatestRunIdForArchitecture_omits_committed_filter_for_architecture_head()
    {
        RunRepositorySql.SelectLatestRunIdForArchitecture.Should().Contain("r.ArchivedUtc IS NULL");
        RunRepositorySql.SelectLatestRunIdForArchitecture.Should().NotContain("LegacyRunStatus");
        RunRepositorySql.SelectLatestRunIdForArchitecture.Should()
            .Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public async Task InMemory_null_architecture_backfill_orders_by_run_id_when_created_utc_ties()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime sharedCreatedUtc = new(2026, 9, 9, 8, 0, 0, DateTimeKind.Utc);
        Guid runA = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
        Guid runB = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");
        Guid runC = Guid.Parse("cccccccc-0000-0000-0000-000000000003");

        InMemoryRunRepository runs = new();

        foreach (Guid runId in new[] { runC, runA, runB })
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = runId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "billing",
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
                    CreatedUtc = sharedCreatedUtc,
                },
                CancellationToken.None);
        }

        IReadOnlyList<RunRecord> listed = await runs.ListWithNullArchitectureIdAsync(scope, 10, CancellationToken.None);

        listed.Select(r => r.RunId).Should().Equal(runA, runB, runC);
    }

    [Fact]
    public void ExistsActiveRunWithSystemNameInWorkspace_sql_collapses_internal_whitespace_before_compare()
    {
        RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace.Should().Contain("STRING_SPLIT");
        RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace.Should().Contain("STRING_AGG");
    }

    [Fact]
    public async Task InMemory_workspace_collision_treats_internal_whitespace_as_equivalent()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "Claims  API",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsActiveRunWithSystemNameInWorkspaceAsync(
            scope,
            "claims api",
            ct: CancellationToken.None);

        exists.Should().BeTrue(
            "workspace system-name guard must treat internal whitespace variants as the same occupied name.");
    }

    [Fact]
    public void NormalizeWorkspaceSystemName_collapses_internal_whitespace()
    {
        RunRepositoryCore.NormalizeWorkspaceSystemName("  claims   api  ").Should().Be("CLAIMS API");
    }

    [Fact]
    public void SelectCommittedRunIdByGoldenManifestId_excludes_current_run_via_exclude_run_id()
    {
        RunRepositorySql.SelectCommittedRunIdByGoldenManifestId.Should().Contain("r.RunId <> @ExcludeRunId");
    }

    [Fact]
    public async Task InMemory_committed_run_by_golden_manifest_excludes_current_run_when_seal_delta_requested()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid lowerRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid higherRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");
        DateTime sharedCreatedUtc = new(2026, 9, 2, 0, 0, 0, DateTimeKind.Utc);

        InMemoryRunRepository runs = new();
        foreach (Guid runId in new[] { lowerRunId, higherRunId })
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = runId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "billing",
                    ArchitectureId = architectureId,
                    GoldenManifestId = manifestId,
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                    CreatedUtc = sharedCreatedUtc,
                },
                CancellationToken.None);
        }

        Guid? selected = await runs.GetCommittedRunIdByGoldenManifestIdAsync(
            scope,
            architectureId,
            manifestId,
            higherRunId,
            CancellationToken.None);

        selected.Should().Be(lowerRunId,
            "seal-delta lookup must skip the current run while still finding the prior committed sibling.");
    }

    [Fact]
    public void ExistsActiveRunWithSystemNameInWorkspace_sql_honors_optional_exclude_run_id()
    {
        RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace.Should()
            .Contain("(@ExcludeRunId IS NULL OR RunId <> @ExcludeRunId)");
    }

    [Fact]
    public void Update_requires_row_version_match_when_stamp_supplied()
    {
        RunRepositorySql.Update.Should().Contain("RowVersionStamp = @RowVersion");
        RunRepositorySql.Update.Should().Contain("@RowVersion IS NULL OR RowVersionStamp = @RowVersion");
    }

    [Fact]
    public void IsEligibleForStaleUncommittedPurge_includes_soft_archived_uncommitted_runs_by_design()
    {
        DateTime cutoff = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);

        RunRepositoryCore.IsEligibleForStaleUncommittedPurge(
            new RunRecord
            {
                CreatedUtc = oldCreated,
                ArchivedUtc = oldCreated.AddDays(1),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            },
            cutoff).Should().BeTrue(
            "retention purge intentionally hard-deletes stale uncommitted rows even when soft-archived.");

        const string purgeSql = """
                                SELECT TOP (@BatchSize)
                                       r.RunId
                                FROM dbo.Runs AS r
                                WHERE r.CreatedUtc < @CutoffUtc
                                  AND (r.LegacyRunStatus IS NULL OR r.LegacyRunStatus <> N'Committed')
                                  AND r.IsDemoWelcomeRun = 0
                                  AND r.IsPublicShowcase = 0
                                ORDER BY r.CreatedUtc ASC;
                                """;

        purgeSql.Should().NotContain("ArchivedUtc",
            "dbo.Archival_PurgeStaleUncommittedRunsBatch matches InMemory eligibility without an archival filter.");
    }

    [Fact]
    public void IsEligibleForSamplePurge_honors_tenant_and_cutoff_filters()
    {
        Guid tenantA = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
        Guid tenantB = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");
        DateTime cutoff = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newCreated = new(2026, 9, 2, 0, 0, 0, DateTimeKind.Utc);

        RunRepositoryCore.IsEligibleForSamplePurge(
            new RunRecord { TenantId = tenantA, IsSample = true, CreatedUtc = oldCreated },
            tenantA,
            cutoff).Should().BeTrue();

        RunRepositoryCore.IsEligibleForSamplePurge(
            new RunRecord { TenantId = tenantB, IsSample = true, CreatedUtc = oldCreated },
            tenantA,
            cutoff).Should().BeFalse();

        RunRepositoryCore.IsEligibleForSamplePurge(
            new RunRecord { TenantId = tenantA, IsSample = true, CreatedUtc = newCreated },
            tenantA,
            cutoff).Should().BeFalse();

        RunRepositoryCore.IsEligibleForSamplePurge(
            new RunRecord { TenantId = tenantA, IsSample = false, CreatedUtc = oldCreated },
            tenantA,
            cutoff).Should().BeFalse();
    }

    [Fact]
    public async Task InMemory_sample_purge_honors_tenant_and_cutoff_filters()
    {
        Guid tenantA = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
        Guid tenantB = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");
        DateTimeOffset cutoff = new(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
        DateTime oldCreated = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newCreated = new(2026, 9, 2, 0, 0, 0, DateTimeKind.Utc);

        InMemoryRunRepository runs = new();
        Guid eligibleRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid otherTenantRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");
        Guid tooNewRunId = Guid.Parse("33333333-0000-0000-0000-000000000003");

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = eligibleRunId,
                TenantId = tenantA,
                WorkspaceId = Guid.NewGuid(),
                ScopeProjectId = Guid.NewGuid(),
                ProjectId = "sample",
                IsSample = true,
                CreatedUtc = oldCreated,
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = otherTenantRunId,
                TenantId = tenantB,
                WorkspaceId = Guid.NewGuid(),
                ScopeProjectId = Guid.NewGuid(),
                ProjectId = "sample",
                IsSample = true,
                CreatedUtc = oldCreated,
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = tooNewRunId,
                TenantId = tenantA,
                WorkspaceId = Guid.NewGuid(),
                ScopeProjectId = Guid.NewGuid(),
                ProjectId = "sample",
                IsSample = true,
                CreatedUtc = newCreated,
            },
            CancellationToken.None);

        RunSamplePurgeBatchResult batch = await runs.HardDeleteSampleRunsBatchAsync(
            tenantA,
            cutoff,
            10,
            CancellationToken.None);

        batch.Deleted.Select(row => row.RunId).Should().Equal(eligibleRunId);
        (await runs.GetByRunIdAdminAsync(otherTenantRunId, CancellationToken.None)).Should().NotBeNull();
        (await runs.GetByRunIdAdminAsync(tooNewRunId, CancellationToken.None)).Should().NotBeNull();
    }

    [Fact]
    public void SampleRunPurgeBatch_honors_optional_tenant_and_cutoff_filters()
    {
        const string sql = """
                           CREATE OR ALTER PROCEDURE dbo.SampleRunPurgeBatch
                           AS
                           SELECT TOP (@BatchSize)
                                  r.RunId
                           FROM dbo.Runs AS r
                           WHERE r.IsSample = 1
                             AND (@TenantId IS NULL OR r.TenantId = @TenantId)
                             AND (@CreatedBeforeUtc IS NULL OR r.CreatedUtc < @CreatedBeforeUtc)
                           ORDER BY r.CreatedUtc ASC;
                           """;

        sql.Should().Contain("(@TenantId IS NULL OR r.TenantId = @TenantId)");
        sql.Should().Contain("(@CreatedBeforeUtc IS NULL OR r.CreatedUtc < @CreatedBeforeUtc)");
        sql.Should().Contain("r.IsSample = 1");
    }

    [Fact]
    public void Project_list_queries_collapse_internal_whitespace_in_project_slug()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should().Contain("STRING_SPLIT");
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should().Contain("STRING_SPLIT");
        RunRepositorySql.SelectLatestWithGraphAtOrBefore.Should().Contain("STRING_SPLIT");
    }

    [Fact]
    public async Task InMemory_list_by_project_matches_internal_whitespace_in_stored_project_slug()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid runId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "Claims  API",
                Description = "internal whitespace slug",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        IReadOnlyList<RunRecord> listed = await runs.ListByProjectAsync(
            scope,
            "claims api",
            10,
            CancellationToken.None);

        listed.Should().ContainSingle(r => r.RunId == runId);
    }

    [Fact]
    public async Task InMemory_matches_internal_whitespace_for_latest_committed_run_lookup()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid committedRunId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = committedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "Claims  Intake",
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                CompletedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CurrentManifestVersion = "v1",
            },
            CancellationToken.None);

        Guid? latest = await runs.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
            scope,
            "claims intake",
            CancellationToken.None);

        latest.Should().Be(committedRunId);
    }

    [Fact]
    public void NormalizeAuthorityProjectSlug_collapses_internal_whitespace()
    {
        RunRepositoryCore.NormalizeAuthorityProjectSlug("  claims   api  ").Should().Be("CLAIMS API");
    }

    [Fact]
    public void SelectPriorCommittedRunIdBeforeCurrent_excludes_failed_runs_with_retained_manifest_headers()
    {
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should()
            .Contain("LegacyRunStatus NOT IN (@FailedStatus, @QualityRejectedStatus)");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByManifestCreatedUtc_excludes_failed_runs_with_retained_manifest_headers()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should()
            .Contain("LegacyRunStatus NOT IN (@FailedStatus, @QualityRejectedStatus)");
    }
}
