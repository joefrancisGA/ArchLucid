using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Pilots;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunRepositoryPilotScorecardMetricsReaderTests
{
    [Fact]
    public async Task GetAsync_counts_committed_runs_in_ambient_scope()
    {
        InMemoryRunRepository runs = new(new InMemoryTenantRepository());
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);

        RunRecord committed = BuildRun(scope, nameof(ArchitectureRunStatus.Committed), Guid.NewGuid(), "v1");
        RunRecord open = BuildRun(scope, nameof(ArchitectureRunStatus.ReadyForCommit), null, null);
        await runs.SaveAsync(committed, CancellationToken.None);
        await runs.SaveAsync(open, CancellationToken.None);

        RunRepositoryPilotScorecardMetricsReader sut = new(runs, scopes.Object);

        PilotScorecardTenantMetrics metrics = await sut.GetAsync(scope.TenantId, CancellationToken.None);

        metrics.TotalRunsCommitted.Should().Be(1);
        metrics.TotalManifestsCreated.Should().Be(1);
        metrics.FirstCommitUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAsync_returns_zeros_when_scope_has_no_committed_runs()
    {
        InMemoryRunRepository runs = new(new InMemoryTenantRepository());
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);

        await runs.SaveAsync(
            BuildRun(scope, nameof(ArchitectureRunStatus.ReadyForCommit), null, null),
            CancellationToken.None);

        RunRepositoryPilotScorecardMetricsReader sut = new(runs, scopes.Object);

        PilotScorecardTenantMetrics metrics = await sut.GetAsync(scope.TenantId, CancellationToken.None);

        metrics.TotalRunsCommitted.Should().Be(0);
        metrics.TotalManifestsCreated.Should().Be(0);
        metrics.FirstCommitUtc.Should().BeNull();
    }

    private static RunRecord BuildRun(
        ScopeContext scope,
        string legacyStatus,
        Guid? goldenManifestId,
        string? manifestVersion)
    {
        return new RunRecord
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p",
            LegacyRunStatus = legacyStatus,
            GoldenManifestId = goldenManifestId,
            CurrentManifestVersion = manifestVersion,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = goldenManifestId is null ? null : TimeProvider.System.UtcNowDateTime().AddMinutes(30),
        };
    }
}
