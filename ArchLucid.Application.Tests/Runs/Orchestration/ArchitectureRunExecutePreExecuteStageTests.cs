using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecutePreExecuteStageTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryDemoteReadyForCommitBeforeSelectiveExecuteAsync_demotes_when_live_header_is_ready_for_commit_even_if_stale_snapshot_was_not()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = runGuid.ToString("N");
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-demote",
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        bool demoted = false;
        runRepository
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>((record, _, _, _) =>
            {
                demoted = true;
                record.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.WaitingForResults));
            })
            .Returns(Task.CompletedTask);

        ArchitectureRunExecutePreExecuteStage sut = new(
            scopeProvider.Object,
            runRepository.Object,
            Mock.Of<IArchitectureRunExecuteIdempotencyStage>(),
            Mock.Of<IArchitectureRunExecuteCancellationGuardStage>());

        await sut.TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(
            runId,
            ArchitectureRunStatus.PartiallyCompleted,
            CancellationToken.None);

        demoted.Should().BeTrue();
    }
}
