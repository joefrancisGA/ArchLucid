using ArchLucid.Application;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorIdempotencyTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteRunAsync_returns_existing_results_for_ready_for_commit_without_reexecuting_agents()
    {
        Guid runGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string runId = runGuid.ToString("N");
        List<AgentResult> existingResults = BuildFourResults(runId);

        Mock<IAgentExecutor> executor = new();
        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            nameof(ArchitectureRunStatus.ReadyForCommit),
            existingResults,
            executor.Object);

        ExecuteRunResult result = await sut.ExecuteRunAsync(runId);

        result.Results.Should().BeEquivalentTo(existingResults);
        executor.Verify(
            e => e.ExecuteAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteRunAsync_throws_conflict_when_terminal_run_has_no_stored_results()
    {
        Guid runGuid = Guid.Parse("22222222-3333-4444-5555-666666666666");
        string runId = runGuid.ToString("N");

        ArchitectureRunExecuteOrchestrator sut = CreateSut(
            runId,
            runGuid,
            nameof(ArchitectureRunStatus.Committed),
            [],
            Mock.Of<IAgentExecutor>());

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*no stored agent results*");
    }

    private static ArchitectureRunExecuteOrchestrator CreateSut(
        string runId,
        Guid runGuid,
        string legacyStatus,
        IReadOnlyList<AgentResult> existingResults,
        IAgentExecutor executor)
    {
        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-idempotent",
            LegacyRunStatus = legacyStatus,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("req-idempotent", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-idempotent",
                Description = new string('x', 12),
                SystemName = "Idempotent",
            });

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentTask { RunId = runId, AgentType = AgentType.Topology, TaskId = existingResults[0].TaskId },
            ]);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo
            .Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>(), null, null))
            .ReturnsAsync(existingResults);

        return new ArchitectureRunExecuteOrchestrator(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor,
            Mock.Of<IAgentEvaluationService>(),
            resultRepo.Object,
            Mock.Of<IAgentEvaluationRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            Mock.Of<IActorContext>(),
            Mock.Of<IBaselineMutationAuditService>(),
            Mock.Of<IAuditService>(),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IAgentOutputTraceEvaluationHook>(),
            new NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            Mock.Of<IRequestContentSafetyPrecheck>(),
            Options.Create(new AgentExecutionOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }

    private static List<AgentResult> BuildFourResults(string runId)
    {
        AgentType[] types = [AgentType.Topology, AgentType.Cost, AgentType.Compliance, AgentType.Critic];

        return types
            .Select(type => new AgentResult
            {
                RunId = runId,
                AgentType = type,
                TaskId = $"{type}-{Guid.NewGuid():N}",
                Claims = ["c"],
                EvidenceRefs = ["e"],
                Confidence = 0.9,
            })
            .ToList();
    }
}
