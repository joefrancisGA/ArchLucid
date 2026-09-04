using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftAdmissionServiceSubmitTests
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

    public DraftAdmissionServiceSubmitTests()
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

        _service = DraftRequestServiceTestFactory.CreateWithDefaults(
            _repository,
            _governanceLoader,
            _architectureRunCommandService,
            _contentSafety,
            new DraftIntakeBranchOptions());
    }

    [Fact]
    public async Task SubmitAsync_WhenCreateRunThrows_DraftStaysAdmitted_AndRetryLinksOneRun()
    {
        int createRunCalls = 0;
        _architectureRunCommandService
            .Setup(o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                ScopeContext _,
                ArchitectureRequest request,
                string? _,
                CancellationToken _) =>
            {
                if (Interlocked.Increment(ref createRunCalls) == 1)
                    throw new InvalidOperationException("transient create-run failure");

                return Task.FromResult(new CreateRunCommandResult
                {
                    StandardResult = new CreateRunResult
                    {
                        Run = new ArchitectureRun { RunId = "linked-run", RequestId = request.RequestId },
                    },
                });
            });

        DraftRequestResponse admitted = await CreateAdmittedWithMustAnswersAsync();
        Guid draftId = admitted.DraftId;

        Func<Task> firstSubmit = async () =>
            await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);

        await firstSubmit.Should().ThrowAsync<InvalidOperationException>();

        DraftRequestResponse? afterFailure = await _service.GetAsync(_scope, draftId, CancellationToken.None);
        afterFailure.Should().NotBeNull();
        afterFailure!.Status.Should().Be(DraftRequestStatus.Admitted);

        SubmitDraftResponse? secondSubmit = await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);

        secondSubmit.Should().NotBeNull();
        secondSubmit!.Status.Should().Be(DraftRequestStatus.RunSpawned);
        secondSubmit.RunId.Should().Be("linked-run");
        secondSubmit.RequestId.Should().Be(DraftSpawnedArchitectureRequestId.FromDraftId(draftId));

        _architectureRunCommandService.Verify(
            static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task SubmitAsync_WhenRunSpawned_ReplaysWithoutSecondCreateRun()
    {
        _architectureRunCommandService
            .Setup(static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(static (ScopeContext _, ArchitectureRequest request, string? __, CancellationToken ___) =>
                Task.FromResult(new CreateRunCommandResult
                {
                    StandardResult = new CreateRunResult
                    {
                        Run = new ArchitectureRun { RunId = "linked-run", RequestId = request.RequestId },
                    },
                }));

        DraftRequestResponse admitted = await CreateAdmittedWithMustAnswersAsync();
        Guid draftId = admitted.DraftId;

        SubmitDraftResponse? first = await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);
        SubmitDraftResponse? second = await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);

        first.Should().NotBeNull();
        second.Should().NotBeNull();
        second!.RunId.Should().Be(first!.RunId);
        second.RequestId.Should().Be(DraftSpawnedArchitectureRequestId.FromDraftId(draftId));

        _architectureRunCommandService.Verify(
            static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitAsync_WhenSubmittedWithoutSpawnedRunId_ThrowsConflict_AndDoesNotCreateRun()
    {
        DraftRequestResponse admitted = await CreateAdmittedWithMustAnswersAsync();
        Guid draftId = admitted.DraftId;

        await _repository.UpdateAsync(
            _scope.TenantId,
            _scope.WorkspaceId,
            _scope.ProjectId,
            draftId,
            DraftRequestStatus.Submitted,
            admitted.Document,
            redirectReason: null,
            spawnedRunId: null,
            CancellationToken.None);

        Func<Task> act = async () => await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage($"*{draftId}*");

        _architectureRunCommandService.Verify(
            static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SubmitAsync_WhenSubmittedWithSpawnedRunId_PromotesWithoutCreateRun()
    {
        DraftRequestResponse admitted = await CreateAdmittedWithMustAnswersAsync();
        Guid draftId = admitted.DraftId;
        const string legacyRunId = "legacy-partial-run";

        await _repository.UpdateAsync(
            _scope.TenantId,
            _scope.WorkspaceId,
            _scope.ProjectId,
            draftId,
            DraftRequestStatus.Submitted,
            admitted.Document,
            redirectReason: null,
            spawnedRunId: legacyRunId,
            CancellationToken.None);

        SubmitDraftResponse? submit = await _service.SubmitAsync(_scope, draftId, null, CancellationToken.None);

        submit.Should().NotBeNull();
        submit!.Status.Should().Be(DraftRequestStatus.RunSpawned);
        submit.RunId.Should().Be(legacyRunId);
        submit.RequestId.Should().Be(DraftSpawnedArchitectureRequestId.FromDraftId(draftId));

        DraftRequestResponse? loaded = await _service.GetAsync(_scope, draftId, CancellationToken.None);
        loaded!.Status.Should().Be(DraftRequestStatus.RunSpawned);
        loaded.SpawnedRunId.Should().Be(legacyRunId);

        _architectureRunCommandService.Verify(
            static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SubmitAsync_create_architecture_routes_through_synthesis_command_result()
    {
        _architectureRunCommandService
            .Setup(static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(static (ScopeContext _, ArchitectureRequest request, string? __, CancellationToken ___) =>
                Task.FromResult(new CreateRunCommandResult
                {
                    SynthesisResult = new ArchitectureSynthesisGenerateResult
                    {
                        RunId = "synth-run-1",
                        PackageOrigin = ArchitecturePackageOrigin.Created,
                        KnowledgeModelId = "model-1",
                    },
                }));

        DraftRequestResponse admitted = await CreateAdmittedWithMustAnswersAsync(
            ArchitectureWorkflowIntent.CreateArchitecture);

        SubmitDraftResponse? submit = await _service.SubmitAsync(_scope, admitted.DraftId, null, CancellationToken.None);

        submit.Should().NotBeNull();
        submit!.RunId.Should().Be("synth-run-1");
    }

    [Fact]
    public void Projector_UsesStableRequestId_FromDraftId()
    {
        Guid draftId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        DraftRequestProjector projector = new();
        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Modernize the claims intake workflow with nightly batch API integration.",
        };

        ArchitectureRequest first = projector.Project(document, draftId);
        ArchitectureRequest second = projector.Project(document, draftId);

        first.RequestId.Should().Be(draftId.ToString("N"));
        second.RequestId.Should().Be(first.RequestId);
    }

    [Fact]
    public void DraftSubmitIdempotency_UsesStableFingerprint_ForSameDraftProjection()
    {
        Guid draftId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DraftRequestProjector projector = new();
        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Modernize the claims intake workflow with nightly batch API integration.",
        };

        ArchitectureRequest request = projector.Project(document, draftId);
        CreateRunIdempotencyState first = DraftSubmitIdempotency.Build(_scope, draftId, request);
        CreateRunIdempotencyState second = DraftSubmitIdempotency.Build(_scope, draftId, projector.Project(document, draftId));

        first.RequestFingerprint.Should().Equal(second.RequestFingerprint);
        first.IdempotencyKeyHash.Should().Equal(second.IdempotencyKeyHash);
        ArchitectureRunIdempotencyHashing.HashIdempotencyKey($"draft-submit:{draftId:N}")
            .Should().Equal(first.IdempotencyKeyHash);
    }

    private async Task<DraftRequestResponse> CreateAdmittedWithMustAnswersAsync(
        string? workflowIntent = null)
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow },
            CancellationToken.None);

        PatchDraftRequest patch = new()
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
        };

        if (!string.IsNullOrWhiteSpace(workflowIntent))
        {
            patch.WorkflowIntent = workflowIntent;

            if (string.Equals(workflowIntent, ArchitectureWorkflowIntent.CreateArchitecture, StringComparison.OrdinalIgnoreCase))
                patch.SystemName = "Synth Draft System";
        }

        await _service.PatchAsync(_scope, created.DraftId, patch, CancellationToken.None);

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
