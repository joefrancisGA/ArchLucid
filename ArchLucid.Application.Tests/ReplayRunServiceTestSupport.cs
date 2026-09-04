using System.Data;

using ArchLucid.Application.Agents;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Replay;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests;

/// <summary>
///     Builds a <see cref="ReplayRunService"/> with staged handlers for unit tests.
/// </summary>
internal static class ReplayRunServiceTestSupport
{
    internal sealed record ReplayRunServiceHarness(
        ReplayRunService Service,
        Mock<IAgentExecutorResolver> ExecutorResolver,
        Mock<IDecisionEngineService> DecisionEngine,
        Mock<IRunDetailQueryService> RunDetailQuery,
        Mock<IRunRepository> AuthorityRunRepository,
        Mock<IAgentEvidencePackageRepository> EvidenceRepository,
        Mock<IAgentTaskRepository> TaskRepository);

    internal static ReplayRunService BuildFromMocks(
        IAgentExecutorResolver executorResolver,
        IDecisionEngineService decisionEngine,
        IArchitectureRequestRepository requestRepository,
        IRunDetailQueryService runDetailQuery,
        IRunRepository authorityRunRepository,
        IScopeContextProvider scopeContextProvider,
        IAgentEvidencePackageRepository evidenceRepository,
        IAgentTaskRepository taskRepository,
        IAgentEvaluationService? agentEvaluationService = null,
        IDecisionEngineV2? decisionEngineV2 = null,
        IAuthorityCommittedManifestChainWriter? authorityChainWriter = null,
        IArchLucidUnitOfWorkFactory? unitOfWorkFactory = null,
        IAuditService? auditService = null,
        IActorContext? actorContext = null,
        IAuthorityRunOrchestrator? authorityRunOrchestrator = null,
        IArchitectureRunCommitOrchestrator? architectureRunCommitOrchestrator = null,
        ICommitRunIdempotencyCoordinator? commitRunIdempotencyCoordinator = null,
        IRunStageOutcomesRepository? runStageOutcomesRepository = null)
    {
        IReplayRunCloneStage cloneStage = new ReplayRunCloneStage();
        IReplayRunPrepareStage prepareStage = new ReplayRunPrepareStage(
            runDetailQuery,
            requestRepository,
            evidenceRepository,
            authorityRunRepository,
            scopeContextProvider,
            taskRepository,
            runStageOutcomesRepository ?? EmptyStageOutcomesRepository(),
            Mock.Of<IRunPolicyPackPinService>(),
            Mock.Of<IRunEvidencePackagePinService>(),
            cloneStage);
        IReplayRunCommitStage commitStage = new ReplayRunCommitStage(
            decisionEngine,
            agentEvaluationService ?? EmptyEvaluationService(),
            decisionEngineV2 ?? EmptyDecisionEngineV2(),
            scopeContextProvider,
            authorityChainWriter ?? CreateAuthorityChainWriterMock().Object,
            unitOfWorkFactory ?? ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            auditService ?? Mock.Of<IAuditService>(),
            actorContext ?? UnitTestActor(),
            architectureRunCommitOrchestrator ?? Mock.Of<IArchitectureRunCommitOrchestrator>(),
            commitRunIdempotencyCoordinator ?? Mock.Of<ICommitRunIdempotencyCoordinator>(),
            authorityRunRepository,
            Mock.Of<IRunPolicyPackPinService>(),
            Mock.Of<IRunEvidencePackagePinService>(),
            cloneStage,
            Mock.Of<IReRunExecuteSealedManifestPinGate>(),
            NullLogger<ReplayRunCommitStage>.Instance);
        IReplayRunExecutePreparedStage executePreparedStage = new ReplayRunExecutePreparedStage(
            runDetailQuery,
            requestRepository,
            evidenceRepository,
            executorResolver,
            authorityRunOrchestrator ?? Mock.Of<IAuthorityRunOrchestrator>(),
            prepareStage,
            cloneStage,
            commitStage,
            authorityRunRepository,
            scopeContextProvider,
            Mock.Of<IRunGovernanceScopePinService>(),
            Mock.Of<IReRunExecuteSealedManifestPinGate>());

        return new ReplayRunService(prepareStage, executePreparedStage);
    }

    internal static ReplayRunServiceHarness CreateHarness(
        IAgentEvaluationService? agentEvaluationService = null,
        IDecisionEngineV2? decisionEngineV2 = null,
        IRunStageOutcomesRepository? runStageOutcomesRepository = null,
        IAuthorityCommittedManifestChainWriter? authorityChainWriter = null,
        IArchLucidUnitOfWorkFactory? unitOfWorkFactory = null,
        IAuditService? auditService = null,
        IActorContext? actorContext = null,
        IAuthorityRunOrchestrator? authorityRunOrchestrator = null,
        IArchitectureRunCommitOrchestrator? architectureRunCommitOrchestrator = null,
        ICommitRunIdempotencyCoordinator? commitRunIdempotencyCoordinator = null)
    {
        Mock<IAgentExecutorResolver> executorResolver = new();
        Mock<IDecisionEngineService> decisionEngine = new();
        Mock<IArchitectureRequestRepository> requestRepository = new();
        Mock<IRunDetailQueryService> runDetailQuery = new();
        Mock<IRunRepository> authorityRunRepository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        Mock<IAgentTaskRepository> taskRepository = new();

        IReplayRunCloneStage cloneStage = new ReplayRunCloneStage();
        IReplayRunPrepareStage prepareStage = new ReplayRunPrepareStage(
            runDetailQuery.Object,
            requestRepository.Object,
            evidenceRepository.Object,
            authorityRunRepository.Object,
            scopeProvider.Object,
            taskRepository.Object,
            runStageOutcomesRepository ?? EmptyStageOutcomesRepository(),
            Mock.Of<IRunPolicyPackPinService>(),
            Mock.Of<IRunEvidencePackagePinService>(),
            cloneStage);
        IReplayRunCommitStage commitStage = new ReplayRunCommitStage(
            decisionEngine.Object,
            agentEvaluationService ?? EmptyEvaluationService(),
            decisionEngineV2 ?? EmptyDecisionEngineV2(),
            scopeProvider.Object,
            authorityChainWriter ?? CreateAuthorityChainWriterMock().Object,
            unitOfWorkFactory ?? ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            auditService ?? Mock.Of<IAuditService>(),
            actorContext ?? UnitTestActor(),
            architectureRunCommitOrchestrator ?? Mock.Of<IArchitectureRunCommitOrchestrator>(),
            commitRunIdempotencyCoordinator ?? Mock.Of<ICommitRunIdempotencyCoordinator>(),
            authorityRunRepository.Object,
            Mock.Of<IRunPolicyPackPinService>(),
            Mock.Of<IRunEvidencePackagePinService>(),
            cloneStage,
            Mock.Of<IReRunExecuteSealedManifestPinGate>(),
            NullLogger<ReplayRunCommitStage>.Instance);
        IReplayRunExecutePreparedStage executePreparedStage = new ReplayRunExecutePreparedStage(
            runDetailQuery.Object,
            requestRepository.Object,
            evidenceRepository.Object,
            executorResolver.Object,
            authorityRunOrchestrator ?? Mock.Of<IAuthorityRunOrchestrator>(),
            prepareStage,
            cloneStage,
            commitStage,
            authorityRunRepository.Object,
            scopeProvider.Object,
            Mock.Of<IRunGovernanceScopePinService>(),
            Mock.Of<IReRunExecuteSealedManifestPinGate>());

        ReplayRunService service = new(prepareStage, executePreparedStage);

        return new ReplayRunServiceHarness(
            service,
            executorResolver,
            decisionEngine,
            runDetailQuery,
            authorityRunRepository,
            evidenceRepository,
            taskRepository);
    }

    internal static Mock<IAgentTaskRepository> CapturingTaskRepository(out List<AgentTask> capturedTasks)
    {
        List<AgentTask> sink = [];
        capturedTasks = sink;

        Mock<IAgentTaskRepository> tasks = new();
        tasks.Setup(x => x.CreateManyAsync(
                It.IsAny<IEnumerable<AgentTask>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>()))
            .Callback<IEnumerable<AgentTask>, CancellationToken, IDbConnection?, IDbTransaction?>(
                (rows, _, _, _) =>
                {
                    sink.Clear();
                    sink.AddRange(rows);
                })
            .Returns(Task.CompletedTask);

        return tasks;
    }

    internal static RunRecord CreateSourceHeader(Guid runId, ScopeContext scope) => new()
    {
        RunId = runId,
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ScopeProjectId = scope.ProjectId,
        ProjectId = string.Empty,
        PinnedPolicyPackIdsJson = "[]",
        LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
    };

    internal static void StubAuthorityRunHeader(Mock<IRunRepository> authorityRuns)
    {
        authorityRuns
            .Setup(x => x.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext scope, Guid id, CancellationToken _) => CreateSourceHeader(id, scope));
    }

    internal static void StubRunDetailForOriginalAndPreparedReplay(
        Mock<IRunDetailQueryService> detail,
        string originalRunId,
        ArchitectureRunDetail originalDetail,
        IReadOnlyList<AgentTask> preparedReplayTasks)
    {
        detail.Setup(x => x.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string runId, CancellationToken _) =>
            {
                if (string.Equals(runId, originalRunId, StringComparison.Ordinal))
                    return originalDetail;

                return new ArchitectureRunDetail
                {
                    Run = new ArchitectureRun
                    {
                        RunId = runId,
                        RequestId = originalDetail.Run.RequestId,
                        Status = ArchitectureRunStatus.WaitingForResults,
                        CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                        CurrentManifestVersion = originalDetail.Run.CurrentManifestVersion,
                    },
                    Tasks = preparedReplayTasks.ToList(),
                };
            });
    }

    private static IAgentEvaluationService EmptyEvaluationService()
    {
        Mock<IAgentEvaluationService> mock = new();
        mock.Setup(x => x.EvaluateAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<IReadOnlyCollection<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return mock.Object;
    }

    private static IDecisionEngineV2 EmptyDecisionEngineV2()
    {
        Mock<IDecisionEngineV2> mock = new();
        mock.Setup(x => x.ResolveAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<IReadOnlyCollection<AgentResult>>(),
                It.IsAny<IReadOnlyCollection<AgentEvaluation>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return mock.Object;
    }

    private static IRunStageOutcomesRepository EmptyStageOutcomesRepository()
    {
        Mock<IRunStageOutcomesRepository> mock = new();
        mock.Setup(r => r.ListByRunIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return mock.Object;
    }

    private static IActorContext UnitTestActor()
    {
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("unit-test");

        return actor.Object;
    }

    private static Mock<IAuthorityCommittedManifestChainWriter> CreateAuthorityChainWriterMock()
    {
        Mock<IAuthorityCommittedManifestChainWriter> mock = new();
        mock.Setup(x => x.PersistCommittedChainAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<GoldenManifest>(),
                It.IsAny<AuthorityChainKeying>(),
                It.IsAny<DateTime>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>(),
                It.IsAny<IReadOnlyList<Finding>?>(),
                It.IsAny<AuthorityCommittedChainSeedCustomization?>()))
            .ReturnsAsync((ScopeContext _, Guid _, string _, GoldenManifest _, AuthorityChainKeying k, DateTime _, bool _, CancellationToken _,
                    IDbConnection? _, IDbTransaction? _, IReadOnlyList<Finding>? _, AuthorityCommittedChainSeedCustomization? _) =>
                new AuthorityManifestPersistResult(
                    k.ContextSnapshotId,
                    k.GraphSnapshotId,
                    k.FindingsSnapshotId,
                    k.DecisionTraceId,
                    k.ManifestId));

        return mock;
    }
}
