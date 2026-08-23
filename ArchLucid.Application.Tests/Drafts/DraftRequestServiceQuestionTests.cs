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
public sealed class DraftRequestServiceQuestionTests
{
    private readonly IDraftRequestRepository _repository = new InMemoryDraftRequestRepository();
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

    public DraftRequestServiceQuestionTests()
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

        _service = DraftRequestServiceTestFactory.CreateWithDefaults(
            _repository,
            _governanceLoader,
            _runCreateOrchestrator,
            _contentSafety,
            new DraftIntakeBranchOptions());
    }

    [Fact]
    public async Task RequestAdmissionAsync_PopulatesRequiredMustQuestions()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        admission!.Admitted.Should().BeTrue();
        admission.Verdict.Kind.Should().Be(FeasibilityVerdictKind.Feasible);
        admission.Verdict.TransparencyTrail.Should().NotBeNull();
        admission.RequiredMustQuestionKeys.Should().HaveCount(UniversalIntakeQuestions.MustQuestions.Count);
        admission.PendingMustQuestions.Should().HaveCount(UniversalIntakeQuestions.MustQuestions.Count);
        admission.Draft.Document.RequiredMustQuestionKeys.Should().HaveCount(UniversalIntakeQuestions.MustQuestions.Count);
    }

    [Fact]
    public async Task SubmitAsync_RequiresMustAnswers_BeforeRunSpawn()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        await _service.RequestAdmissionAsync(_scope, created.DraftId, CancellationToken.None);

        Func<Task> act = () => _service.SubmitAsync(_scope, created.DraftId, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*MUST question*");
    }

    [Fact]
    public async Task SubmitAsync_SpawnsRun_AfterMustQuestionsAnswered()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        foreach (string mustKey in admission!.RequiredMustQuestionKeys)
        {
            await _service.AnswerQuestionAsync(
                _scope,
                created.DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = mustKey, Answer = "Covered in design." },
                CancellationToken.None);
        }

        SubmitDraftResponse? submit = await _service.SubmitAsync(_scope, created.DraftId, CancellationToken.None);

        submit!.Status.Should().Be(DraftRequestStatus.RunSpawned);
    }

    [Fact]
    public async Task SubmitAsync_SpawnsRun_AfterMustQuestionsSkipped()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        foreach (string mustKey in admission!.RequiredMustQuestionKeys)
        {
            await _service.SkipQuestionAsync(
                _scope,
                created.DraftId,
                new SkipDraftQuestionRequest { QuestionKey = mustKey },
                CancellationToken.None);
        }

        SubmitDraftResponse? submit = await _service.SubmitAsync(_scope, created.DraftId, CancellationToken.None);

        submit!.Status.Should().Be(DraftRequestStatus.RunSpawned);
    }

    [Fact]
    public async Task SkipQuestionAsync_RecordsMustSkipOnTransparencyTrail()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        string mustKey = admission!.RequiredMustQuestionKeys[0];

        DraftRequestResponse? skipped = await _service.SkipQuestionAsync(
            _scope,
            created.DraftId,
            new SkipDraftQuestionRequest { QuestionKey = mustKey },
            CancellationToken.None);

        skipped.Should().NotBeNull();
        skipped!.Document.TransparencyTrail.Skipped.Should()
            .ContainSingle(entry => entry.QuestionKey == mustKey && entry.Tier == ElicitationQuestionTier.Must);
    }

    [Fact]
    public async Task SkipQuestionAsync_Throws_WhenQuestionNotInSelection()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        Func<Task> act = () => _service.SkipQuestionAsync(
            _scope,
            created.DraftId,
            new SkipDraftQuestionRequest { QuestionKey = "not.a.real.question" },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not part of the current selection*");
    }

    [Fact]
    public async Task AnswerQuestionAsync_ClearsPriorSkip_FromTransparencyTrail()
    {
        DraftRequestResponse created = await CreateAdmissibleDraftAsync();

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        string mustKey = admission!.RequiredMustQuestionKeys[0];

        await _service.SkipQuestionAsync(
            _scope,
            created.DraftId,
            new SkipDraftQuestionRequest { QuestionKey = mustKey },
            CancellationToken.None);

        DraftRequestResponse? answered = await _service.AnswerQuestionAsync(
            _scope,
            created.DraftId,
            new AnswerDraftQuestionRequest { QuestionKey = mustKey, Answer = "Now answered." },
            CancellationToken.None);

        answered!.Document.TransparencyTrail.Skipped.Should()
            .NotContain(entry => entry.QuestionKey == mustKey);
        answered.Document.QuestionAnswers.Should().ContainKey(mustKey);
    }

    [Fact]
    public async Task RequestAdmissionAsync_ReusesAnswersFromPriorRunSpawnedDraft()
    {
        DraftRequestResponse first = await CreateAdmissibleDraftAsync();

        DraftAdmissionResponse? firstAdmission = await _service.RequestAdmissionAsync(
            _scope,
            first.DraftId,
            CancellationToken.None);

        foreach (string mustKey in firstAdmission!.RequiredMustQuestionKeys)
        {
            await _service.AnswerQuestionAsync(
                _scope,
                first.DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = mustKey, Answer = "First pilot answer." },
                CancellationToken.None);
        }

        await _service.SubmitAsync(_scope, first.DraftId, CancellationToken.None);

        DraftRequestResponse second = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest
            {
                FreeTextIntent =
                    "Second pilot review for the same regulated workload with governed evidence intake, Entra ID authentication, and exportable architecture review packages.",
            },
            CancellationToken.None);

        await _service.PatchAsync(
            _scope,
            second.DraftId,
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

        DraftAdmissionResponse? secondAdmission = await _service.RequestAdmissionAsync(
            _scope,
            second.DraftId,
            CancellationToken.None);

        secondAdmission!.Admitted.Should().BeTrue();
        secondAdmission.PendingMustQuestions.Should().BeEmpty();
        secondAdmission.Draft.Document.QuestionAnswers.Should().HaveCount(UniversalIntakeQuestions.MustQuestions.Count);
        secondAdmission.Draft.Document.TransparencyTrail.Asserted.Should().Contain(entry =>
            entry.Key.StartsWith("reused.answer.", StringComparison.OrdinalIgnoreCase));
    }

    private async Task<DraftRequestResponse> CreateAdmissibleDraftAsync()
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

        return created;
    }
}
