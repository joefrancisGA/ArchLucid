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
