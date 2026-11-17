using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunArchiveSealRaceTests
{
    [Fact]
    public async Task Archive_preserves_a_run_sealed_after_the_initial_read()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(new RunRecord
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        }, CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);
        Mock<IWorkOwnershipDeleteAuthorizationService> authorization = new();
        authorization
            .Setup(a => a.EnsureCanDeleteOwnedWorkAsync(It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns((string? _, CancellationToken ct) =>
                runs.MarkAuthorityPipelineCommittedAsync(scope, runId, manifestId, DateTime.UtcNow, ct));
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ArchitectureRunArchiveService service = new(
            runs, scopeProvider.Object, audit.Object, Mock.Of<IActorContext>(), authorization.Object,
            NullLogger<ArchitectureRunArchiveService>.Instance);

        ArchitectureRunArchiveOutcome outcome = await service.TryArchiveAsync(runId, CancellationToken.None);

        outcome.Should().Be(ArchitectureRunArchiveOutcome.SealedReviewBlocked);
        RunRecord? persisted = await runs.GetByIdAsync(scope, runId, CancellationToken.None);
        persisted.Should().NotBeNull();
        persisted!.GoldenManifestId.Should().Be(manifestId);
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
