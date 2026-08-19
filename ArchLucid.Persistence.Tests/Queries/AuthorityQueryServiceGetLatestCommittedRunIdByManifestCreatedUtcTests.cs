using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
public sealed class AuthorityQueryServiceGetLatestCommittedRunIdByManifestCreatedUtcTests
{
    [Fact]
    public async Task InMemory_returns_run_with_newest_CompletedUtc_stand_in_for_manifest()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Guid olderCommitRunId = Guid.NewGuid();
        Guid newerCommitRunId = Guid.NewGuid();
        DateTime baseUtc = new(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = olderCommitRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = baseUtc.AddDays(2),
                CompletedUtc = baseUtc.AddHours(1),
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CurrentManifestVersion = "v-old"
            },
            CancellationToken.None);

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = newerCommitRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = baseUtc,
                CompletedUtc = baseUtc.AddDays(3),
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                CurrentManifestVersion = "v-new"
            },
            CancellationToken.None);

        Guid? latest = await runs.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
            scope,
            "default",
            CancellationToken.None);

        latest.Should().Be(newerCommitRunId);
    }

    [Fact]
    public async Task InMemory_returns_null_when_no_committed_manifest_runs()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "default",
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            },
            CancellationToken.None);

        Guid? latest = await runs.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
            scope,
            "default",
            CancellationToken.None);

        latest.Should().BeNull();
    }
}
