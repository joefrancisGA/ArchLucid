using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.ExecuteOwnership;

[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipReconciliationServiceTests
{
    [Fact]
    public async Task ReconcileExpiredLeasesAsync_marks_interrupted_run_partial_and_deletes_lease()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.ListExpiredRunIdsAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([runId]);

        RunRecord header = new()
        {
            RunId = runId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid(),
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
        };

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByRunIdAdminAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        runs.Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask)
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (record, _, _, _) => header.LegacyRunStatus = record.LegacyRunStatus);

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new AgentResult { RunId = runId.ToString("D"), TaskId = "t1", AgentType = AgentType.Topology }]);

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions { Enabled = true });

        RunExecuteOwnershipReconciliationService sut = new(
            leases.Object,
            runs.Object,
            results.Object,
            new RunStateTransitionService(),
            storage.Object,
            options.Object,
            NullLogger<RunExecuteOwnershipReconciliationService>.Instance);

        RunExecuteOwnershipReconciliationReport report =
            await sut.ReconcileExpiredLeasesAsync(CancellationToken.None);

        report.ExpiredLeaseCount.Should().Be(1);
        report.ReconciledCount.Should().Be(1);
        header.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Failed));
        leases.Verify(l => l.TryDeleteAsync(runId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
