using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Drafts.Stages;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DraftRequestMutateStageForceOverwriteAuditTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task PatchAsync_force_overwrite_writes_required_keep_mine_audit()
    {
        IDraftRequestRepository repository = new InMemoryDraftRequestRepository();
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DraftRequestMutateStage sut = CreateSut(repository, audit.Object);
        DraftRequestResponse created = await CreateDraftAsync(repository);
        DateTime previousUpdatedUtc = created.UpdatedUtc;

        DraftRequestResponse? updated = await sut.PatchAsync(
            Scope,
            created.DraftId,
            new PatchDraftRequest
            {
                SystemName = "Keep mine architecture",
                ForceOverwrite = true,
            },
            CancellationToken.None);

        updated.Should().NotBeNull();
        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.EventType == AuditEventTypes.DraftIntakeForceOverwriteApplied
                    && eventRecord.DataJson.Contains(created.DraftId.ToString(), StringComparison.OrdinalIgnoreCase)
                    && eventRecord.DataJson.Contains("previousUpdatedUtc", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
        previousUpdatedUtc.Should().NotBe(default);
    }

    [Fact]
    public async Task PatchAsync_matching_token_does_not_write_force_overwrite_audit()
    {
        IDraftRequestRepository repository = new InMemoryDraftRequestRepository();
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DraftRequestMutateStage sut = CreateSut(repository, audit.Object);
        DraftRequestResponse created = await CreateDraftAsync(repository);

        DraftRequestResponse? updated = await sut.PatchAsync(
            Scope,
            created.DraftId,
            new PatchDraftRequest
            {
                SystemName = "Token match architecture",
                ExpectedUpdatedUtc = created.UpdatedUtc,
            },
            CancellationToken.None);

        updated.Should().NotBeNull();
        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static DraftRequestMutateStage CreateSut(IDraftRequestRepository repository, IAuditService audit)
    {
        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActor()).Returns("operator@test");
        actor.Setup(context => context.GetActorId()).Returns("jwt:test:operator");

        return new DraftRequestMutateStage(
            repository,
            Mock.Of<IQuestionSelectionEngine>(),
            Mock.Of<IWorkspaceSystemNameCollisionGuard>(),
            Mock.Of<IArchitectureIdentityService>(),
            Mock.Of<IPresenterIntakeTrailSyncService>(),
            new DraftForceOverwriteAuditSupport(
                audit,
                actor.Object,
                NullLogger<DraftForceOverwriteAuditSupport>.Instance));
    }

    private static Task<DraftRequestResponse> CreateDraftAsync(IDraftRequestRepository repository)
    {
        return repository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator@test",
            new DraftRequestDocument
            {
                FreeTextIntent = DraftIntakeTestIntents.ValidWorkflowPlatform,
            },
            CancellationToken.None);
    }
}
