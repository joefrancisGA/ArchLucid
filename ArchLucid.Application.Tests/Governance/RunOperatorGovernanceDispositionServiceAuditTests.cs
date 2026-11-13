using ArchLucid.Application;
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

    [Fact]
    public async Task RecordAsync_WhenCommittedManifestMissing_DoesNotWriteDispositionOrAudit()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IRunRepository> runRepository = new();
        Mock<IAuditService> auditService = new();

        RunOperatorGovernanceDispositionService sut = new(
            runRepository.Object,
            auditService.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<RunOperatorGovernanceDispositionService>.Instance);

        RecordRunOperatorGovernanceDispositionRequest request = new()
        {
            Decision = RunOperatorGovernanceDecision.Approved,
            Rationale = "no unsealed decisions",
        };

        Func<Task> act = () => sut.RecordAsync(runId, request, scope, "operator-1", false, CancellationToken.None);

        (await act.Should().ThrowAsync<ConflictException>())
            .WithMessage("*committed golden manifest is missing*");

        runRepository.Verify(r => r.TrySetOperatorGovernanceDispositionAsync(
            It.IsAny<ScopeContext>(),
            It.IsAny<Guid>(),
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<string>(),
            It.IsAny<DateTime>(),
            It.IsAny<CancellationToken>()), Times.Never);
        auditService.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
