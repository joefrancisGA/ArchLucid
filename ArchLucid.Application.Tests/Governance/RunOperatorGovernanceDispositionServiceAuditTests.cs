using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RunOperatorGovernanceDispositionServiceAuditTests
{
    [Fact]
    public async Task RecordAsync_WhenDurableAuditFailsAfterRetries_ThrowsDurableAuditWriteFailedException()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        RunRecord run = new() { RunId = runId };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        runRepository
            .Setup(r => r.TrySetOperatorGovernanceDispositionAsync(
                scope,
                runId,
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit unavailable"));

        RunOperatorGovernanceDispositionService sut = new(
            runRepository.Object,
            auditService.Object,
            NullLogger<RunOperatorGovernanceDispositionService>.Instance);

        RecordRunOperatorGovernanceDispositionRequest request = new()
        {
            Decision = RunOperatorGovernanceDecision.Approved,
            Rationale = "ship it",
        };

        Func<Task> act = () => sut.RecordAsync(runId, request, scope, "operator-1", false, CancellationToken.None);

        (await act.Should().ThrowAsync<DurableAuditWriteFailedException>())
            .Which.OperationLabel.Should().Contain(runId.ToString("N"));
    }
}
