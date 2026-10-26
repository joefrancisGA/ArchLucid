using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;
using FluentAssertions.Specialized;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AuthorityDrivenArchitectureRunCommitOrchestratorAgentResultsTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_CommitRunAsync_merges_agent_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("40404040-4040-4040-4040-404040404040");
        string runId = runGuid.ToString("N");
        string legacyUpper = runId.ToUpperInvariant();
        string requestId = Guid.NewGuid().ToString("D");

        Mock<IAuthorityCommitFailureRecorder> failureRecorder = new();
        failureRecorder
            .Setup(recorder => recorder.RecordFailureAsync(
                It.IsAny<string>(),
                runId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ArchitectureRequestId = requestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IAgentTaskRepository> tasks = new();
        tasks
            .Setup(repository => repository.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        List<AgentResult> legacyResults = CommitReadySet();
        foreach (AgentResult result in legacyResults)
            result.RunId = legacyUpper;

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(TestScope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyResults);
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(
                TestScope,
                It.Is<string>(id => id != runId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActor()).Returns("unit-test-actor");
        actor.Setup(context => context.GetActorId()).Returns("unit-test-actor");

        Mock<IAuthorityCommitIdempotencyHandler> idempotency = new();
        idempotency
            .Setup(handler => handler.TryReturnCommittedAsync(
                It.IsAny<ArchitectureRun>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CommitRunResult?)null);

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = new(
            runRepository.Object,
            scopeProvider.Object,
            tasks.Object,
            requests.Object,
            agentResults.Object,
            actor.Object,
            new RunStateTransitionService(),
            idempotency.Object,
            Mock.Of<IAuthorityCommitDecisionMaterializationStage>(),
            Mock.Of<IAuthorityCommitGovernanceStage>(),
            Mock.Of<IAuthorityCommitPersistenceStage>(),
            failureRecorder.Object,
            Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IArtifactBundleRepository>(),
            Mock.Of<IAuthorityCommitProjectionBuilder>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IUserWorkspaceModeReader>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator>>());

        Func<Task> act = () => sut.CommitRunAsync(runId, CancellationToken.None);

        ExceptionAssertions<InvalidOperationException> thrown =
            await act.Should().ThrowAsync<InvalidOperationException>();
        thrown.Which.Message.Should().Contain("not found");

        failureRecorder.Verify(
            recorder => recorder.RecordFailureAsync(
                It.IsAny<string>(),
                runId,
                It.Is<string>(message => message.Contains("cannot be committed until all required agents succeed", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static List<AgentResult> CommitReadySet()
    {
        return
        [
            CommitReady(AgentType.Topology),
            CommitReady(AgentType.Cost),
            CommitReady(AgentType.Compliance),
            CommitReady(AgentType.Critic),
        ];
    }

    private static AgentResult CommitReady(AgentType agentType)
    {
        AgentResult result = new()
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = Guid.NewGuid().ToString("N"),
            TaskId = Guid.NewGuid().ToString("N"),
            AgentType = agentType,
            CreatedUtc = DateTime.UtcNow,
            Claims = ["ok"],
        };

        return result;
    }
}
