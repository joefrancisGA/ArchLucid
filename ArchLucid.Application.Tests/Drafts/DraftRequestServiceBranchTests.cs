using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs;
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
public sealed class DraftRequestServiceBranchTests
{
    private readonly IDraftRequestRepository _repository = new InMemoryDraftRequestRepository();
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

    public DraftRequestServiceBranchTests()
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

        DraftRunCommandServiceTestDoubles.SetupCreateSequence(
            _architectureRunCommandService,
            ("parent-run", "req-parent"),
            ("branch-run", "req-branch"));

        _service = DraftRequestServiceTestFactory.CreateWithDefaults(
            _repository,
            _governanceLoader,
            _architectureRunCommandService,
            _contentSafety,
            new DraftIntakeBranchOptions { MaxBranchesPerParentDraft = 3 });
    }

    [Fact]
    public async Task BranchAsync_ClonesParent_WithSingleOverride_AndAdmits()
    {
        DraftRequestResponse parent = await CreateAdmittedParentAsync();
        string mustKey = UniversalIntakeQuestions.MustQuestions[0].QuestionKey;
        string originalAnswer = "Original constraint.";

        await _service.AnswerQuestionAsync(
            _scope,
            parent.DraftId,
            new AnswerDraftQuestionRequest { QuestionKey = mustKey, Answer = originalAnswer },
            CancellationToken.None);

        BranchDraftResponse? branch = await _service.BranchAsync(
            _scope,
            parent.DraftId,
            "operator-1",
            new BranchDraftRequest
            {
                OverrideKind = DraftBranchOverrideKind.QuestionAnswer,
                OverrideKey = mustKey,
                OverrideValue = "Relaxed constraint for what-if.",
            },
            CancellationToken.None);

        branch.Should().NotBeNull();
        branch!.ParentDraftId.Should().Be(parent.DraftId);
        branch.Branch.Status.Should().Be(DraftRequestStatus.Admitted);
        branch.Branch.Document.ParentDraftId.Should().Be(parent.DraftId);
        branch.Branch.Document.ConversationThreadId.Should().BeNull();
        branch.Branch.Document.QuestionAnswers[mustKey].Should().Be("Relaxed constraint for what-if.");
        branch.Branch.Document.QuestionAnswers[mustKey].Should().NotBe(originalAnswer);

        DraftRequestResponse? parentReloaded = await _service.GetAsync(_scope, parent.DraftId, CancellationToken.None);
        parentReloaded!.Document.QuestionAnswers[mustKey].Should().Be(originalAnswer);
    }

    [Fact]
    public async Task SubmitAsync_ReturnsParentSpawnedRunId_WhenBranchParentAlreadySpawned()
    {
        DraftRequestResponse parent = await CreateAdmittedParentAsync();

        foreach (string key in UniversalIntakeQuestions.MustQuestions.Select(static q => q.QuestionKey))
        {
            await _service.AnswerQuestionAsync(
                _scope,
                parent.DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = key, Answer = "Addressed." },
                CancellationToken.None);
        }

        SubmitDraftResponse? parentSubmit = await _service.SubmitAsync(
            _scope,
            parent.DraftId,
            CancellationToken.None);

        parentSubmit.Should().NotBeNull();
        parentSubmit!.RunId.Should().NotBeNullOrWhiteSpace();

        BranchDraftResponse? branch = await _service.BranchAsync(
            _scope,
            parent.DraftId,
            "operator-1",
            new BranchDraftRequest
            {
                OverrideKind = DraftBranchOverrideKind.BusinessOutcome,
                OverrideValue = "Lower cost target for what-if.",
            },
            CancellationToken.None);

        branch.Should().NotBeNull();

        foreach (string key in branch!.Branch.Document.RequiredMustQuestionKeys)
        {
            await _service.AnswerQuestionAsync(
                _scope,
                branch.Branch.DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = key, Answer = "Addressed on branch." },
                CancellationToken.None);
        }

        SubmitDraftResponse? branchSubmit = await _service.SubmitAsync(
            _scope,
            branch.Branch.DraftId,
            CancellationToken.None);

        branchSubmit.Should().NotBeNull();
        branchSubmit!.ParentSpawnedRunId.Should().Be(parentSubmit.RunId);
    }

    [Fact]
    public async Task BranchAsync_Throws_WhenBranchCapReached()
    {
        DraftRequestResponse parent = await CreateAdmittedParentAsync();

        for (int index = 0; index < 3; index++)
        {
            await _service.BranchAsync(
                _scope,
                parent.DraftId,
                "operator-1",
                new BranchDraftRequest
                {
                    OverrideKind = DraftBranchOverrideKind.BusinessOutcome,
                    OverrideValue = $"Outcome variant {index}",
                },
                CancellationToken.None);
        }

        Func<Task> act = () => _service.BranchAsync(
            _scope,
            parent.DraftId,
            "operator-1",
            new BranchDraftRequest
            {
                OverrideKind = DraftBranchOverrideKind.BusinessOutcome,
                OverrideValue = "One branch too many",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*branch cap*");
    }

    [Fact]
    public async Task GetBranchQuotaAsync_ReturnsRemainingCapacity()
    {
        DraftRequestResponse parent = await CreateAdmittedParentAsync();

        DraftBranchQuotaResponse? quota = await _service.GetBranchQuotaAsync(
            _scope,
            parent.DraftId,
            CancellationToken.None);

        quota.Should().NotBeNull();
        quota!.MaxBranchesPerParent.Should().Be(3);
        quota.RemainingBranches.Should().Be(3);
        quota.CanBranch.Should().BeTrue();
    }

    [Fact]
    public async Task BranchAsync_Throws_WhenParentNotAdmitted()
    {
        DraftRequestResponse parent = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidWorkflowPlatform },
            CancellationToken.None);

        Func<Task> act = () => _service.BranchAsync(
            _scope,
            parent.DraftId,
            "operator-1",
            new BranchDraftRequest
            {
                OverrideKind = DraftBranchOverrideKind.BusinessOutcome,
                OverrideValue = "Lower cost target",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*cannot branch*");
    }

    private async Task<DraftRequestResponse> CreateAdmittedParentAsync()
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

        return admission.Draft;
    }
}
