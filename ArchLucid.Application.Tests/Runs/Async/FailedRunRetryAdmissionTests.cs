using ArchLucid.Application.Runs.Async;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Async;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FailedRunRetryAdmissionTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Fact]
    public async Task TryMarkRetryingAsync_promotes_failed_run_and_clears_completed_utc()
    {
        Guid runId = Guid.NewGuid();
        RunRecord header = new()
        {
            RunId = runId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            RetryCount = 2,
            CompletedUtc = TimeProvider.System.UtcNowDateTime()
        };
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        FailedRunRetryAdmission sut = new(runs.Object);

        await sut.TryMarkRetryingAsync(DefaultScope, runId);

        header.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Retrying));
        header.RetryCount.Should().Be(3);
        header.CompletedUtc.Should().BeNull();
        runs.Verify(r => r.UpdateAsync(header, It.IsAny<CancellationToken>(), null, null), Times.Once);
    }

    [Fact]
    public async Task TryMarkRetryingAsync_ignores_non_failed_runs()
    {
        Guid runId = Guid.NewGuid();
        RunRecord header = new()
        {
            RunId = runId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
        };
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        FailedRunRetryAdmission sut = new(runs.Object);

        await sut.TryMarkRetryingAsync(DefaultScope, runId);

        header.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Created));
        runs.Verify(
            r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null),
            Times.Never);
    }
}
