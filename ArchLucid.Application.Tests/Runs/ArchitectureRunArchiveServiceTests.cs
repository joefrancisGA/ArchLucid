using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunArchiveServiceTests
{
    [Fact]
    public async Task TryArchiveAsync_blocks_sealed_reviews()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        InMemoryRunRepository runs = new();

        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = runId,
                ProjectId = "retail-api",
                CreatedUtc = DateTime.UtcNow,
                GoldenManifestId = Guid.NewGuid(),
            },
            CancellationToken.None);

        ArchitectureRunArchiveService service = CreateService(runs, scope);

        ArchitectureRunArchiveOutcome outcome =
            await service.TryArchiveAsync(runId, CancellationToken.None);

        outcome.Should().Be(ArchitectureRunArchiveOutcome.SealedReviewBlocked);
    }

    [Fact]
    public async Task TryArchiveAsync_archives_in_flight_review_and_emits_audit()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        InMemoryRunRepository runs = new();

        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = runId,
                ProjectId = "retail-api",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IAuditService> audit = new();
        AuditEvent? captured = null;
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        ArchitectureRunArchiveService service = CreateService(runs, scope, audit.Object);

        ArchitectureRunArchiveOutcome outcome =
            await service.TryArchiveAsync(runId, CancellationToken.None);

        outcome.Should().Be(ArchitectureRunArchiveOutcome.Archived);
        RunRecord? archived = await runs.GetByIdAsync(scope, runId, CancellationToken.None);
        archived.Should().NotBeNull();
        archived!.ArchivedUtc.Should().NotBeNull();
        captured.Should().NotBeNull();
        captured!.EventType.Should().Be(AuditEventTypes.ArchitectureReviewArchived);
    }

    private static ArchitectureRunArchiveService CreateService(
        InMemoryRunRepository runs,
        ScopeContext scope,
        IAuditService? auditService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");
        actor.Setup(a => a.GetActorId()).Returns("operator@test");

        return new ArchitectureRunArchiveService(
            runs,
            scopeProvider.Object,
            auditService ?? new Mock<IAuditService>().Object,
            actor.Object);
    }
}
