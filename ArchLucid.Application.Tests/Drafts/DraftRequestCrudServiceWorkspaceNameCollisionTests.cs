using ArchLucid.Application.Authorization;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.Stages;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftRequestCrudServiceWorkspaceNameCollisionTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task PatchAsync_forwards_prior_run_id_to_workspace_name_collision_guard()
    {
        Guid priorRunId = Guid.Parse("f1329b7e-5168-4ed2-96aa-03e8fc09eb1b");
        IDraftRequestRepository repository = new InMemoryDraftRequestRepository();
        Mock<IWorkspaceSystemNameCollisionGuard> guard = new();
        guard
            .Setup(g => g.EnsureAvailableAsync(
                Scope,
                "ArchLucid",
                WorkspaceSystemNameOccupancyKind.Architecture,
                It.IsAny<Guid?>(),
                priorRunId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DraftRequestCrudService sut = new(
            repository,
            new DraftRequestCreateStage(
                repository,
                Mock.Of<IPriorPackageSemanticMergeService>(),
                Mock.Of<IArchitectureIdentityService>()),
            new DraftRequestMutateStage(repository, Mock.Of<IQuestionSelectionEngine>(), guard.Object),
            new DraftRequestDeleteStage(repository, Mock.Of<IWorkOwnershipDeleteAuthorizationService>()));

        DraftRequestResponse created = await repository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator@test",
            new DraftRequestDocument
            {
                FreeTextIntent = new string('x', DraftIntakeValidation.MinimumFreeTextIntentLength),
                PriorRunId = priorRunId.ToString("N"),
            },
            CancellationToken.None);

        await sut.PatchAsync(
            Scope,
            created.DraftId,
            new PatchDraftRequest { SystemName = "ArchLucid" },
            CancellationToken.None);

        guard.Verify(
            g => g.EnsureAvailableAsync(
                Scope,
                "ArchLucid",
                WorkspaceSystemNameOccupancyKind.Architecture,
                created.DraftId,
                priorRunId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
