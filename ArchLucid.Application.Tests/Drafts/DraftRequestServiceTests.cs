using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs.Orchestration;
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
public sealed class DraftRequestServiceTests
{
    private readonly IDraftRequestRepository _repository = new InMemoryDraftRequestRepository();
    private readonly IDraftAdmissionGate _admissionGate = new DraftAdmissionGate();
    private readonly IDraftRequestProjector _projector = new DraftRequestProjector();
    private readonly Mock<IEffectiveGovernanceLoader> _governanceLoader = new();
    private readonly Mock<IArchitectureRunCreateOrchestrator> _runCreateOrchestrator = new();
    private readonly Mock<IRequestContentSafetyPrecheck> _contentSafety = new();

    private readonly DraftRequestService _service;
    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    public DraftRequestServiceTests()
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

        _runCreateOrchestrator
            .Setup(static o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunResult
            {
                Run = new ArchitectureRun { RunId = "abc123run", RequestId = "req123" },
            });

        FeasibilityVerdictBuilder verdictBuilder = new(new FeasibilityVerdictValidator());

        _service = new DraftRequestService(
            _repository,
            _admissionGate,
            new PassThroughDraftSemanticAdmissionEvaluator(),
            new QuestionSelectionEngine(_governanceLoader.Object),
            _projector,
            _runCreateOrchestrator.Object,
            _contentSafety.Object,
            verdictBuilder,
            Mock.Of<IPriorPackageSemanticMergeService>(),
            new FixedDraftIntakeBranchOptionsMonitor(new DraftIntakeBranchOptions()));
    }

    [Fact]
    public async Task CreateAsync_StoresDraftInDraftingStatus()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow },
            CancellationToken.None);

        created.Status.Should().Be(DraftRequestStatus.Drafting);
        created.Document.FreeTextIntent.Should().Contain("GRC");
    }

    [Fact]
    public async Task RequestAdmissionAsync_Redirects_WhenActorMissing()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest
            {
                FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
            },
            CancellationToken.None);

        await _service.PatchAsync(
            _scope,
            created.DraftId,
            new PatchDraftRequest { BusinessOutcome = "Faster audit prep" },
            CancellationToken.None);

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        admission.Should().NotBeNull();
        admission!.Admitted.Should().BeFalse();
        admission.Status.Should().Be(DraftRequestStatus.Redirected);
        admission.Verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        admission.Verdict.SoftEnvelope.Should().NotBeNull();
        admission.Verdict.HardCitations.Should().BeEmpty();
    }

    [Fact]
    public async Task SubmitAsync_SpawnsRun_WhenAdmitted()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest
            {
                FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
            },
            CancellationToken.None);

        await _service.PatchAsync(
            _scope,
            created.DraftId,
            new PatchDraftRequest
            {
                BusinessOutcome = "Faster audit prep",
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

        admission!.Admitted.Should().BeTrue();

        foreach (string mustKey in admission.RequiredMustQuestionKeys)
        {
            await _service.AnswerQuestionAsync(
                _scope,
                created.DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = mustKey, Answer = "Addressed." },
                CancellationToken.None);
        }

        SubmitDraftResponse? submit = await _service.SubmitAsync(_scope, created.DraftId, CancellationToken.None);

        submit.Should().NotBeNull();
        submit!.Status.Should().Be(DraftRequestStatus.RunSpawned);
        submit.RunId.Should().Be("abc123run");

        _runCreateOrchestrator.Verify(
            static o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
