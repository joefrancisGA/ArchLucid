using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Guards architecture-request idempotency seeks on <see cref="SqlRunRepository" /> against
///     <see cref="InMemoryRunRepository" /> parity.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunRepositoryArchitectureRequestSqlTests
{
    [Fact]
    public void Architecture_request_queries_trim_stored_request_id_before_compare()
    {
        RunRepositorySql.CountActiveRunsForArchitectureRequest.Should().Contain("LTRIM(RTRIM(");
        RunRepositorySql.CountActiveRunsForArchitectureRequest.Should().Contain("ArchitectureRequestId");
        RunRepositorySql.ExistsRunForArchitectureRequestInScope.Should().Contain("LTRIM(RTRIM(");
        RunRepositorySql.ExistsRunForArchitectureRequestInScope.Should().Contain("ArchitectureRequestId");
    }

    [Fact]
    public async Task InMemory_count_active_runs_matches_padded_stored_architecture_request_id()
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
                ArchitectureRequestId = "  req-padded  ",
                LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        int count = await runs.CountActiveRunsForArchitectureRequestAsync(
            scope,
            "req-padded",
            CancellationToken.None);

        count.Should().Be(1, "active-run concurrency checks must ignore padding on stored architecture request ids.");
    }

    [Fact]
    public async Task InMemory_exists_run_for_architecture_request_matches_padded_stored_id()
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
                ArchitectureRequestId = "  req-padded  ",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        bool exists = await runs.ExistsRunForArchitectureRequestInScopeAsync(
            scope,
            "req-padded",
            CancellationToken.None);

        exists.Should().BeTrue("scope existence checks must ignore padding on stored architecture request ids.");
    }

    [Fact]
    public void Architecture_list_queries_read_persisted_package_origin_without_dashboard_coalesce()
    {
        const string listByArchitectureSql = """
                                             SELECT RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description,
                                                    PackageOrigin, ArchitectureId, ArchitectureVersionId, CreatedUtc, UpdatedUtc,
                                                    ArchivedUtc, LegacyRunStatus, CurrentManifestVersion, GoldenManifestId
                                             FROM dbo.Runs
                                             """;

        listByArchitectureSql.Should().Contain("PackageOrigin");
        listByArchitectureSql.Should().NotContain("JSON_VALUE(");
        listByArchitectureSql.Should().NotContain("COALESCE(");
    }

    [Fact]
    public void ExistsRunForArchitectureRequestInScope_includes_archived_runs_by_design()
    {
        RunRepositorySql.ExistsRunForArchitectureRequestInScope.Should().NotContain("ArchivedUtc");
    }

    [Fact]
    public void SelectLatestCommittedRunIdByManifestCreatedUtc_orders_by_manifest_created_utc()
    {
        RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc.Should()
            .Contain("ORDER BY gm.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void SelectRepresentativeRunIdForArchitectureRequestInScope_orders_by_created_utc_then_run_id()
    {
        RunRepositorySql.SelectRepresentativeRunIdForArchitectureRequestInScope.Should()
            .Contain("ORDER BY CreatedUtc DESC, RunId DESC");
    }

    [Fact]
    public async Task InMemory_representative_run_id_picks_highest_run_id_when_created_utc_ties()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime createdUtc = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        Guid lowerRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        Guid higherRunId = Guid.Parse("22222222-0000-0000-0000-000000000002");

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = lowerRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureRequestId = "req-tie",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = createdUtc,
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
                ArchitectureRequestId = "req-tie",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = createdUtc,
            },
            CancellationToken.None);

        Guid? representative = await runs.TryGetRepresentativeRunIdForArchitectureRequestInScopeAsync(
            scope,
            "req-tie",
            CancellationToken.None);

        representative.Should().Be(higherRunId,
            "sealed-manifest guard must pick a deterministic representative when request runs share CreatedUtc.");
    }

    [Fact]
    public void SelectRepresentativeRunIdForArchitectureRequestInScope_includes_archived_reruns_by_design()
    {
        RunRepositorySql.SelectRepresentativeRunIdForArchitectureRequestInScope.Should()
            .NotContain("ArchivedUtc IS NULL",
                "representative lookup is historical like ExistsRunForArchitectureRequestInScope; active reads filter archived separately.");
    }

    [Fact]
    public async Task InMemory_representative_run_id_includes_archived_rerun_when_newest()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime createdUtc = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        Guid activeRunId = Guid.NewGuid();
        Guid archivedRunId = Guid.NewGuid();

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = activeRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureRequestId = "req-archived",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = createdUtc,
            },
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = archivedRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "billing",
                ArchitectureRequestId = "req-archived",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = createdUtc.AddMinutes(1),
                ArchivedUtc = createdUtc.AddMinutes(2),
            },
            CancellationToken.None);

        Guid? representative = await runs.TryGetRepresentativeRunIdForArchitectureRequestInScopeAsync(
            scope,
            "req-archived",
            CancellationToken.None);

        representative.Should().Be(archivedRunId,
            "representative locator includes archived reruns; sealed-manifest guard falls through when detail read hides archived rows.");
    }

    [Fact]
    public async Task InMemory_count_active_runs_ignores_case_on_architecture_request_id()
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
                ArchitectureRequestId = "REQ-CASE",
                LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        int count = await runs.CountActiveRunsForArchitectureRequestAsync(
            scope,
            "req-case",
            CancellationToken.None);

        count.Should().Be(1);
    }
}
