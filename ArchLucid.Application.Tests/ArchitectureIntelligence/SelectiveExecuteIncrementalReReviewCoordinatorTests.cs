using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SelectiveExecuteIncrementalReReviewCoordinatorTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryRunAfterSelectiveExecuteAsync_returns_null_when_no_knowledge_model()
    {
        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(k => k.GetForRunAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureKnowledgeModel?)null);

        SelectiveExecuteIncrementalReReviewCoordinator sut = CreateSut(
            knowledgeModelAccess.Object,
            taskRepository: Mock.Of<IAgentTaskRepository>());

        IncrementalReReviewResult? result = await sut.TryRunAfterSelectiveExecuteAsync(
            "aaaaaaaa11112222333344445555666677778888",
            new SelectiveAgentExecuteRequest { AgentTypes = ["Topology"] },
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task TryRunAfterSelectiveExecuteAsync_runs_scoped_re_review_for_topology()
    {
        string runId = Guid.NewGuid().ToString("N");
        string taskId = "task-topo";

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = TestScope.TenantId.ToString("D"),
            RunId = runId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "component-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Gateway",
                },
            ],
        };

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(k => k.GetForRunAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(model);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new AgentTask
                {
                    RunId = runId,
                    TaskId = taskId,
                    AgentType = AgentType.Topology,
                },
            ]);

        Mock<IRunStageOutcomesRepository> stages = new();
        stages
            .Setup(s => s.RecordStageStartedAsync(
                It.IsAny<Guid>(),
                "incremental-re-review",
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);
        stages
            .Setup(s => s.RecordStageCompletedAsync(
                It.IsAny<Guid>(),
                "incremental-re-review",
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        SelectiveExecuteIncrementalReReviewCoordinator sut = CreateSut(
            knowledgeModelAccess.Object,
            taskRepo.Object,
            stages.Object,
            audit.Object);

        IncrementalReReviewResult? result = await sut.TryRunAfterSelectiveExecuteAsync(
            runId,
            new SelectiveAgentExecuteRequest { AgentTypes = ["Topology"] },
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Scope.AffectedElementIds.Should().Contain("component-1");
        result.SpecialistResults.Should().NotBeEmpty();
        result.GlobalInvariantResults.Should().HaveCount(5);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.Run.IncrementalReReviewCompleted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryRunAfterSelectiveExecuteAsync_triggers_full_re_review_when_critic_forced()
    {
        string runId = Guid.NewGuid().ToString("N");
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-2",
            TenantId = TestScope.TenantId.ToString("D"),
            RunId = runId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "component-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Gateway",
                },
            ],
        };

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(k => k.GetForRunAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(model);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new AgentTask { RunId = runId, TaskId = "task-critic", AgentType = AgentType.Critic },
            ]);

        Mock<IRunStageOutcomesRepository> stages = new();
        stages
            .Setup(s => s.RecordStageStartedAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);
        stages
            .Setup(s => s.RecordStageCompletedAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        SelectiveExecuteIncrementalReReviewCoordinator sut = CreateSut(
            knowledgeModelAccess.Object,
            taskRepo.Object,
            stages.Object,
            Mock.Of<IAuditService>());

        IncrementalReReviewResult? result = await sut.TryRunAfterSelectiveExecuteAsync(
            runId,
            new SelectiveAgentExecuteRequest { AgentTypes = ["Critic"] },
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.FullReReviewTriggered.Should().BeTrue();
    }

    private static SelectiveExecuteIncrementalReReviewCoordinator CreateSut(
        IArchitectureKnowledgeModelAccess knowledgeModelAccess,
        IAgentTaskRepository? taskRepository = null,
        IRunStageOutcomesRepository? stageOutcomesRepository = null,
        IAuditService? auditService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        return new SelectiveExecuteIncrementalReReviewCoordinator(
            scopeProvider.Object,
            taskRepository ?? Mock.Of<IAgentTaskRepository>(),
            knowledgeModelAccess,
            new IncrementalReReviewService(),
            new AsyncSpecialistReviewServiceAdapter(new SpecialistReviewService()),
            stageOutcomesRepository ?? Mock.Of<IRunStageOutcomesRepository>(),
            auditService ?? Mock.Of<IAuditService>());
    }

    private sealed class AsyncSpecialistReviewServiceAdapter(SpecialistReviewService inner) : IAsyncSpecialistReviewService
    {
        public Task<SpecialistReviewResult> ReviewAsync(
            ArchitectureKnowledgeModel model,
            IReadOnlyList<QualityDimension>? dimensions = null,
            CancellationToken cancellationToken = default)
            => Task.FromResult(inner.Review(model, dimensions));
    }
}
