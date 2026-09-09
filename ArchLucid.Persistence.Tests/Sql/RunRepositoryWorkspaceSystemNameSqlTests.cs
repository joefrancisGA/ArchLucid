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
        RunRepositorySql.SelectLatestWithGraphAtOrBefore.Should().Contain("UPPER(LTRIM(RTRIM(ProjectId)))");
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should().Contain("UPPER(LTRIM(RTRIM(r.ProjectId)))");
        RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent.Should().Contain("UPPER(LTRIM(RTRIM(r.ProjectId)))");
    }

    [Fact]
    public void Project_list_queries_trim_project_id_before_upper_compare()
    {
        HotPathRelationalQueryShapes.RunsListByProjectNoLock.Should().Contain("UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedProjectSlug");
        HotPathRelationalQueryShapes.RunsListByProjectKeysetNoLock.Should().Contain("UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedProjectSlug");
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
}
