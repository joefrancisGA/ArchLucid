using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
public sealed class AuthorityQueryServiceGetPriorCommittedRunIdBeforeCurrentTests
{
    [Fact]
    public async Task InMemory_returns_most_recent_committed_run_before_current_in_created_order()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        DateTime baseUtc = new(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);
        Guid olderCommittedRunId = Guid.NewGuid();
        Guid middleActiveRunId = Guid.NewGuid();
        Guid newerCommittedRunId = Guid.NewGuid();

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            BuildCommittedRun(scope, olderCommittedRunId, "default", baseUtc.AddDays(-2)),
            CancellationToken.None);
        await runs.SaveAsync(
            BuildCommittedRun(scope, newerCommittedRunId, "default", baseUtc.AddDays(-1)),
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = middleActiveRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = baseUtc,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            },
            CancellationToken.None);

        Guid? prior = await runs.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            "default",
            middleActiveRunId,
            baseUtc,
            CancellationToken.None);

        prior.Should().Be(newerCommittedRunId);
    }

    [Fact]
    public async Task InMemory_resolves_prior_committed_when_active_run_is_outside_recent_list_window()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        DateTime baseUtc = new(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);
        Guid staleActiveRunId = Guid.NewGuid();
        Guid priorCommittedRunId = Guid.NewGuid();

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            BuildCommittedRun(scope, priorCommittedRunId, "default", baseUtc.AddDays(-30)),
            CancellationToken.None);

        for (int i = 0; i < 65; i++)
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = Guid.NewGuid(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "default",
                    CreatedUtc = baseUtc.AddHours(i),
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
                },
                CancellationToken.None);
        }

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = staleActiveRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = baseUtc.AddDays(-5),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            },
            CancellationToken.None);

        IReadOnlyList<RunRecord> recentRuns = await runs.ListByProjectAsync(scope, "default", 60, CancellationToken.None);
        recentRuns.Should().NotContain(r => r.RunId == staleActiveRunId);

        Guid? prior = await runs.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            "default",
            staleActiveRunId,
            baseUtc.AddDays(-5),
            CancellationToken.None);

        prior.Should().Be(priorCommittedRunId);
    }

    [Fact]
    public async Task InMemory_returns_true_prior_committed_before_current_not_first_committed_in_recent_list_window()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        DateTime baseUtc = new(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);
        Guid truePriorCommittedRunId = Guid.NewGuid();
        Guid wrongListCommittedRunId = Guid.NewGuid();
        Guid currentActiveRunId = Guid.NewGuid();

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            BuildCommittedRun(scope, truePriorCommittedRunId, "default", baseUtc.AddDays(-50)),
            CancellationToken.None);

        for (int dayOffset = -49; dayOffset <= -12; dayOffset++)
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = Guid.NewGuid(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "default",
                    CreatedUtc = baseUtc.AddDays(dayOffset),
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
                },
                CancellationToken.None);
        }

        await runs.SaveAsync(
            BuildCommittedRun(scope, wrongListCommittedRunId, "default", baseUtc.AddDays(-11)),
            CancellationToken.None);
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = currentActiveRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = baseUtc.AddDays(-10),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            },
            CancellationToken.None);

        for (int dayOffset = -9; dayOffset <= 48; dayOffset++)
        {
            await runs.SaveAsync(
                new RunRecord
                {
                    RunId = Guid.NewGuid(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = "default",
                    CreatedUtc = baseUtc.AddDays(dayOffset),
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
                },
                CancellationToken.None);
        }

        IReadOnlyList<RunRecord> recentRuns = await runs.ListByProjectAsync(scope, "default", 60, CancellationToken.None);
        recentRuns.Should().Contain(r => r.RunId == currentActiveRunId);
        recentRuns.Should().Contain(r => r.RunId == wrongListCommittedRunId);
        recentRuns.Should().NotContain(r => r.RunId == truePriorCommittedRunId);

        Guid? prior = await runs.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            "default",
            currentActiveRunId,
            baseUtc.AddDays(-10),
            CancellationToken.None);

        prior.Should().Be(truePriorCommittedRunId);
        prior.Should().NotBe(wrongListCommittedRunId);
    }

    [Fact]
    public async Task InMemory_returns_null_when_no_committed_run_exists_before_current()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        DateTime createdUtc = new(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);
        Guid currentRunId = Guid.NewGuid();

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = currentRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = createdUtc,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            },
            CancellationToken.None);

        Guid? prior = await runs.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            "default",
            currentRunId,
            createdUtc,
            CancellationToken.None);

        prior.Should().BeNull();
    }

    private static RunRecord BuildCommittedRun(
        ScopeContext scope,
        Guid runId,
        string projectId,
        DateTime createdUtc)
    {
        return new RunRecord
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = projectId,
            CreatedUtc = createdUtc,
            CompletedUtc = createdUtc.AddHours(1),
            GoldenManifestId = Guid.NewGuid(),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CurrentManifestVersion = "v1"
        };
    }
}
