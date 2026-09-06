using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestPresenterAnswerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task AnswerQuestionAsync_RunSpawned_with_presenter_capture_records_asserted_metadata()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        InMemoryDraftRequestRepository repository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureRequestRepository requestRepository = new();

        DraftRequestResponse created = await repository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator@test",
            new DraftRequestDocument
            {
                FreeTextIntent = new string('x', DraftIntakeValidation.MinimumFreeTextIntentLength),
            },
            CancellationToken.None);

        string requestId = DraftSpawnedArchitectureRequestId.FromDraftId(created.DraftId);

        await requestRepository.CreateAsync(
            new ArchitectureRequest
            {
                RequestId = requestId,
                SystemName = "Platform",
                Environment = "prod",
                Description = "Test platform review.",
                RequestSource = "draft-intake",
                IntakeTransparencyTrail = new TransparencyTrail(),
            },
            CancellationToken.None);

        await runRepository.SaveAsync(
            new RunRecord
            {
                RunId = runId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                ProjectId = Scope.ProjectId.ToString("D"),
                ArchitectureRequestId = requestId,
            },
            CancellationToken.None);

        await repository.UpdateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            created.DraftId,
            DraftRequestStatus.RunSpawned,
            created.Document,
            redirectReason: null,
            spawnedRunId: runId.ToString("D"),
            CancellationToken.None);

        Mock<IEffectiveGovernanceLoader> governanceLoader = new();
        governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        Mock<IArchitectureRunCommandService> architectureRunCommandService = new();
        DraftRunCommandServiceTestDoubles.SetupStandardReviewCreate(architectureRunCommandService);

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(static s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        DraftRequestService service = DraftRequestServiceTestFactory.CreateWithDefaults(
            repository,
            governanceLoader,
            architectureRunCommandService,
            contentSafety,
            new DraftIntakeBranchOptions(),
            runRepository,
            requestRepository);

        DraftRequestResponse? answered = await service.AnswerQuestionAsync(
            Scope,
            created.DraftId,
            new AnswerDraftQuestionRequest
            {
                QuestionKey = "latency",
                Answer = "Yes",
                PresenterCapture = true,
                ResponderLabel = "Room",
            },
            CancellationToken.None);

        answered.Should().NotBeNull();
        answered!.Document.TransparencyTrail.Asserted.Should().Contain(entry =>
            entry.Key == "answer.latency"
            && entry.Value == "Yes"
            && entry.QuestionId == "latency"
            && entry.ResponderLabel == "Room"
            && entry.RecordedUtc.HasValue);

        ArchitectureRequest? syncedRequest = await requestRepository.GetByIdAsync(requestId, CancellationToken.None);
        syncedRequest!.IntakeTransparencyTrail!.Asserted.Should().Contain(entry =>
            entry.Key == "answer.latency" && entry.Value == "Yes");
    }
}
