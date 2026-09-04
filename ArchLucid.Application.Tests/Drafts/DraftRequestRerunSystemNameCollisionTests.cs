using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestRerunSystemNameCollisionTests
{
    private static readonly Guid PriorRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly IDraftRequestRepository _repository = new InMemoryDraftRequestRepository();
    private readonly Mock<IWorkspaceSystemNameCollisionGuard> _collisionGuard = new();
    private readonly Mock<IEffectiveGovernanceLoader> _governanceLoader = new();
    private readonly Mock<IArchitectureRunCommandService> _architectureRunCommandService = new();
    private readonly Mock<IRequestContentSafetyPrecheck> _contentSafety = new();
    private readonly DraftRequestService _service;

    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    public DraftRequestRerunSystemNameCollisionTests()
    {
        _governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        _contentSafety
            .Setup(static s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        _collisionGuard
            .Setup(static g => g.EnsureAvailableAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<WorkspaceSystemNameOccupancyKind>(),
                It.IsAny<Guid?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DraftRunCommandServiceTestDoubles.SetupStandardReviewCreate(_architectureRunCommandService);

        _service = DraftRequestServiceTestFactory.Create(
            _repository,
            new DraftAdmissionGate(),
            new QuestionSelectionEngine(_governanceLoader.Object),
            new DraftRequestProjector(),
            _architectureRunCommandService.Object,
            _contentSafety.Object,
            new FeasibilityVerdictBuilder(new FeasibilityVerdictValidator()),
            Mock.Of<IPriorPackageSemanticMergeService>(),
            new FixedDraftIntakeBranchOptionsMonitor(new DraftIntakeBranchOptions()),
            _collisionGuard.Object,
            new PassThroughDraftSemanticAdmissionEvaluator());
    }

    [Fact]
    public async Task PatchAsync_excludes_prior_run_from_system_name_collision_when_rerunning()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest
            {
                FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
                PriorRunId = PriorRunId.ToString("N"),
            },
            CancellationToken.None);

        Guid draftId = created.DraftId;

        await _service.PatchAsync(
            _scope,
            draftId,
            new PatchDraftRequest { SystemName = "ArchLucid" },
            CancellationToken.None);

        _collisionGuard.Verify(
            g => g.EnsureAvailableAsync(
                It.IsAny<ScopeContext>(),
                "ArchLucid",
                WorkspaceSystemNameOccupancyKind.Architecture,
                draftId,
                PriorRunId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitAsync_excludes_prior_run_from_system_name_collision_when_rerunning()
    {
        DraftRequestResponse admitted = await CreateAdmittedRerunDraftAsync();
        Guid draftId = admitted.DraftId;

        _collisionGuard.Invocations.Clear();

        await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);

        _collisionGuard.Verify(
            g => g.EnsureAvailableAsync(
                It.IsAny<ScopeContext>(),
                "ArchLucid",
                WorkspaceSystemNameOccupancyKind.Review,
                draftId,
                PriorRunId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private async Task<DraftRequestResponse> CreateAdmittedRerunDraftAsync()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest
            {
                FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
                PriorRunId = PriorRunId.ToString("N"),
            },
            CancellationToken.None);

        await _service.PatchAsync(
            _scope,
            created.DraftId,
            new PatchDraftRequest
            {
                BusinessOutcome = "Faster audit prep",
                SystemName = "ArchLucid",
                ActorSet = new ActorSet
                {
                    Actors =
                    [
                        new ActorDescriptor
                        {
                            Kind = ActorKind.Human,
                            TrustOrigin = TrustOrigin.Internal,
                            Contract = InteractionContract.Sync,
                            Origin = ActorOrigin.Asserted,
                        },
                    ],
                },
            },
            CancellationToken.None);

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        admission.Should().NotBeNull();
        admission!.Admitted.Should().BeTrue();

        foreach (string mustKey in admission.RequiredMustQuestionKeys)
        {
            await _service.AnswerQuestionAsync(
                _scope,
                created.DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = mustKey, Answer = "Addressed." },
                CancellationToken.None);
        }

        return admission.Draft;
    }
}
