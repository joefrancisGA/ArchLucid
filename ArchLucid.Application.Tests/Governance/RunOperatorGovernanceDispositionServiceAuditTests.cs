using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

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

        // Satisfy the sealed-manifest authority gate so this test reaches the durable audit retry path.
        string sealedHash = new('a', 64);
        ManifestDocument goldenManifest = new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestHash = sealedHash,
        };

        Mock<IAuthorityQueryService> authorityQueryService = new();
        authorityQueryService
            .Setup(q => q.GetRunDetailForManifestCompareAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = run, GoldenManifest = goldenManifest });

        Mock<IManifestHashService> manifestHashService = new();
        manifestHashService
            .Setup(h => h.ComputeHash(goldenManifest))
            .Returns(sealedHash);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit unavailable"));

        RunOperatorGovernanceDispositionService sut = new(
            runRepository.Object,
            auditService.Object,
            authorityQueryService.Object,
            manifestHashService.Object,
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
