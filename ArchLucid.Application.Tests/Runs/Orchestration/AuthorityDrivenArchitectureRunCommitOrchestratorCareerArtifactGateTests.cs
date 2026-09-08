using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
/// FC-09 / FC-15: verifies finalize commit orchestration blocks on incomplete trail and skipped MUST.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityDrivenArchitectureRunCommitOrchestratorCareerArtifactGateTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid RunGuid = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    private static readonly string RunId = RunGuid.ToString("N");
    private const string RequestId = "req-career-gate";

    [SkippableFact]
    public async Task CommitRunAsync_blocks_finalize_when_intake_trail_is_null()
    {
        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(
            out Mock<IArchitectureRequestRepository> requestRepository,
            transparencyTrail: null);

        Func<Task> act = async () => await sut.CommitRunAsync(RunId, CancellationToken.None);

        PreCommitGovernanceBlockedException exception = (await act.Should().ThrowAsync<PreCommitGovernanceBlockedException>())
            .Which;

        exception.Result.Blocked.Should().BeTrue();
        exception.Result.Reason.Should().Be(CareerArtifactCompletenessValidator.FinalizeTrailMissingMessage);
        requestRepository.Verify(
            repository => repository.GetByIdAsync(RequestId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task CommitRunAsync_blocks_finalize_when_skipped_must_questions_present()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Must,
                    QuestionKey = "security.dataClassification",
                },
            ],
        };

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(
            out _,
            transparencyTrail: trail);

        Func<Task> act = async () => await sut.CommitRunAsync(RunId, CancellationToken.None);

        PreCommitGovernanceBlockedException exception = (await act.Should().ThrowAsync<PreCommitGovernanceBlockedException>())
            .Which;

        exception.Result.Blocked.Should().BeTrue();
        exception.Result.Reason.Should().Be("1 required question is unanswered.");
    }

    [SkippableFact]
    public async Task CommitRunAsync_blocks_finalize_when_degraded_finding_coverage_on_working_desk()
    {
        Guid findingsSnapshotId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        FindingsSnapshot degradedSnapshot = new()
        {
            FindingsSnapshotId = findingsSnapshotId,
            RunId = RunGuid,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "cost",
                    Category = "Cost",
                    ErrorMessage = "offline",
                    ExceptionType = nameof(InvalidOperationException),
                    DurationMs = 1,
                    OccurredUtc = DateTime.UtcNow,
                },
            ],
            Findings =
            [
                new Finding
                {
                    FindingType = "RequirementFinding",
                    Category = "Requirement",
                    EngineType = "requirement",
                    Title = "r",
                    Rationale = "r",
                    Severity = FindingSeverity.Info,
                },
            ],
        };

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(
            out _,
            transparencyTrail: new TransparencyTrail(),
            findingsSnapshot: degradedSnapshot,
            findingsSnapshotId: findingsSnapshotId);

        Func<Task> act = async () => await sut.CommitRunAsync(RunId, CancellationToken.None);

        PreCommitGovernanceBlockedException exception = (await act.Should().ThrowAsync<PreCommitGovernanceBlockedException>())
            .Which;

        exception.Result.Blocked.Should().BeTrue();
        exception.Result.Reason.Should().Contain("cost/Cost");
        exception.Result.Reason.Should().Contain("Finding coverage is degraded");
    }

    private static AuthorityDrivenArchitectureRunCommitOrchestrator CreateSut(
        out Mock<IArchitectureRequestRepository> requestRepository,
        TransparencyTrail? transparencyTrail,
        FindingsSnapshot? findingsSnapshot = null,
        Guid? findingsSnapshotId = null)
    {
        requestRepository = new Mock<IArchitectureRequestRepository>();
        requestRepository
            .Setup(repository => repository.GetByIdAsync(RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = RequestId,
                IntakeTransparencyTrail = transparencyTrail,
            });

        Mock<IRunRepository> runRepository = new();
        RunRecord runRecord = CreateReadyRunRecord(findingsSnapshotId);
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, RunGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRecord);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IAgentTaskRepository> taskRepository = new();
        taskRepository
            .Setup(repository => repository.GetByRunIdAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentTask>());

        Mock<IAgentResultRepository> agentResultRepository = new();
        agentResultRepository
            .Setup(repository => repository.GetByRunIdAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateCommitReadyAgentResults());

        Mock<IAuthorityCommitIdempotencyHandler> idempotencyHandler = new();
        idempotencyHandler
            .Setup(handler => handler.TryReturnCommittedAsync(
                It.IsAny<ArchitectureRun>(),
                RunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CommitRunResult?)null);

        Mock<IAuthorityCommitFailureRecorder> failureRecorder = new();
        failureRecorder
            .Setup(recorder => recorder.RecordFailureAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActor()).Returns("unit-test-actor");

        Mock<IUserWorkspaceModeReader> userWorkspaceModeReader = new();
        userWorkspaceModeReader
            .Setup(reader => reader.IsWorkingDeskAsync("unit-test-actor", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IFindingsSnapshotRepository> findingsSnapshotRepository = new();
        if (findingsSnapshot is not null && findingsSnapshotId is Guid snapshotId)
        {
            findingsSnapshotRepository
                .Setup(repository => repository.GetByIdAsync(TestScope, snapshotId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(findingsSnapshot);
        }

        return new AuthorityDrivenArchitectureRunCommitOrchestrator(
            runRepository.Object,
            scopeProvider.Object,
            taskRepository.Object,
            requestRepository.Object,
            agentResultRepository.Object,
            actor.Object,
            new RunStateTransitionService(),
            idempotencyHandler.Object,
            Mock.Of<IAuthorityCommitDecisionMaterializationStage>(),
            Mock.Of<IAuthorityCommitGovernanceStage>(),
            Mock.Of<IAuthorityCommitPersistenceStage>(),
            failureRecorder.Object,
            Mock.Of<IGoldenManifestRepository>(),
            findingsSnapshotRepository.Object,
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IArtifactBundleRepository>(),
            Mock.Of<IAuthorityCommitProjectionBuilder>(),
            Mock.Of<IManifestHashService>(),
            userWorkspaceModeReader.Object,
            Mock.Of<ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator>>());
    }

    private static RunRecord CreateReadyRunRecord(Guid? findingsSnapshotId = null) =>
        new()
        {
            RunId = RunGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "project-slug",
            ArchitectureRequestId = RequestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            FindingsSnapshotId = findingsSnapshotId,
        };

    private static IReadOnlyList<AgentResult> CreateCommitReadyAgentResults() =>
    [
        CommitReady(AgentType.Topology),
        CommitReady(AgentType.Cost),
        CommitReady(AgentType.Compliance),
        CommitReady(AgentType.Critic),
    ];

    private static AgentResult CommitReady(AgentType agentType) =>
        new()
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = RunId,
            TaskId = agentType.ToString(),
            AgentType = agentType,
            Claims = ["ok"],
        };
}
