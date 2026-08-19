using ArchLucid.Application.Decisions;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class DecisionEngineV2NodeMaterializerTests
{
    [Fact]
    public async Task MaterializeIfMissingAsync_skips_when_nodes_already_exist()
    {
        string runId = Guid.NewGuid().ToString("N");
        Guid runGuid = Guid.Parse(runId);
        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new DecisionNodeRecord { RunId = runId }]);

        DecisionEngineV2NodeMaterializer sut = CreateSut(decisionNodes: decisionNodes.Object);

        await sut.MaterializeIfMissingAsync(runId, CancellationToken.None);

        decisionNodes.Verify(
            r => r.CreateManyAsync(It.IsAny<IReadOnlyList<DecisionNodeRecord>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task MaterializeIfMissingAsync_persists_resolved_nodes_when_missing()
    {
        string runId = Guid.NewGuid().ToString("N");
        Guid runGuid = Guid.Parse(runId);
        string requestId = "REQ-1";
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        ArchitectureRequest request = new() { RequestId = requestId, SystemName = "system" };
        AgentEvidencePackage evidence = new() { RunId = runId };
        AgentTask task = new() { RunId = runId, TaskId = "task-1" };
        AgentResult result = new() { RunId = runId, TaskId = "task-1" };
        DecisionNode resolved = new() { RunId = runId, Topic = "TopologyAcceptance" };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = requestId });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IAgentTaskRepository> tasks = new();
        tasks
            .Setup(r => r.GetByRunIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([task]);

        Mock<IAgentEvidencePackageRepository> evidencePackages = new();
        evidencePackages
            .Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(evidence);

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(r => r.GetByRunIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        Mock<IAgentEvaluationService> evaluations = new();
        evaluations
            .Setup(s => s.EvaluateAsync(runId, request, evidence, It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new AgentEvaluation { RunId = runId, TargetAgentTaskId = "task-1" }]);

        Mock<IDecisionEngineV2> engineV2 = new();
        engineV2
            .Setup(e => e.ResolveAsync(runId, request, It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<IReadOnlyList<AgentEvaluation>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([resolved]);

        Mock<IDecisionNodeRepository> decisionNodes = new();
        decisionNodes
            .Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ILogger<DecisionEngineV2NodeMaterializer>> logger = new();

        DecisionEngineV2NodeMaterializer sut = CreateSut(
            scopeProvider.Object,
            runs.Object,
            requests.Object,
            tasks.Object,
            evidencePackages.Object,
            results.Object,
            evaluations.Object,
            engineV2.Object,
            decisionNodes.Object,
            logger.Object);

        await sut.MaterializeIfMissingAsync(runId, CancellationToken.None);

        decisionNodes.Verify(
            r => r.CreateManyAsync(
                It.Is<IReadOnlyList<DecisionNodeRecord>>(records => records.Count == 1 && records[0].Topic == "TopologyAcceptance"),
                It.IsAny<CancellationToken>()),
            Times.Once);

        logger.Verify(
            l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) =>
                    state.ToString()!.Contains(DecisionEngineV2NodeMaterializer.UnusedAppendixWarning, StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void UnusedAppendixWarning_documents_that_post_commit_nodes_are_not_DecideAsync_inputs()
    {
        DecisionEngineV2NodeMaterializer.UnusedAppendixWarning.Should().Contain("unused appendix");
        DecisionEngineV2NodeMaterializer.UnusedAppendixWarning.Should().Contain("DecideAsync");
        DecisionEngineV2NodeMaterializer.UnusedAppendixWarning.Should().Contain("ManifestDocument");
    }

    private static DecisionEngineV2NodeMaterializer CreateSut(
        IScopeContextProvider? scopeProvider = null,
        IRunRepository? runRepository = null,
        IArchitectureRequestRepository? requestRepository = null,
        IAgentTaskRepository? taskRepository = null,
        IAgentEvidencePackageRepository? evidencePackageRepository = null,
        IAgentResultRepository? agentResultRepository = null,
        IAgentEvaluationService? agentEvaluationService = null,
        IDecisionEngineV2? decisionEngineV2 = null,
        IDecisionNodeRepository? decisionNodes = null,
        ILogger<DecisionEngineV2NodeMaterializer>? logger = null)
    {
        return new DecisionEngineV2NodeMaterializer(
            scopeProvider ?? Mock.Of<IScopeContextProvider>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            requestRepository ?? Mock.Of<IArchitectureRequestRepository>(),
            taskRepository ?? Mock.Of<IAgentTaskRepository>(),
            evidencePackageRepository ?? Mock.Of<IAgentEvidencePackageRepository>(),
            agentResultRepository ?? Mock.Of<IAgentResultRepository>(),
            agentEvaluationService ?? Mock.Of<IAgentEvaluationService>(),
            decisionEngineV2 ?? Mock.Of<IDecisionEngineV2>(),
            decisionNodes ?? Mock.Of<IDecisionNodeRepository>(),
            logger ?? Mock.Of<ILogger<DecisionEngineV2NodeMaterializer>>());
    }
}
