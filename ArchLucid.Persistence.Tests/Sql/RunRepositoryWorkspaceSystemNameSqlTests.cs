using ArchLucid.Contracts.Common;
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
        sql.Should().Contain(nameof(ArchitectureRunStatus.Failed));
        sql.Should().Contain(nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected));
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
}
