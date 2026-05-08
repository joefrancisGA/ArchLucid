using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
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
public sealed class ArchitectureRunExecuteOrchestratorExecuteFailureSummaryTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ExecuteRunAsync_when_executor_fails_persists_LastFailureReason_and_audit_uses_summary_json()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = runGuid.ToString("N");
        string secret = "provider echo: sk-secret and raw completion text";

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-exec-fail",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-exec-fail",
            Description = new string('x', 12),
            SystemName = "ExecFail",
        };

        AgentTask task = new()
        {
            TaskId = "t1",
            RunId = runId,
            AgentType = AgentType.Compliance
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo.Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>())).ReturnsAsync(request);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo.Setup(t => t.GetByRunIdAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync([task]);

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                runId,
                request,
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AgentHandlerExecutionException(
                AgentTypeKeys.Compliance,
                AgentType.Compliance,
                new InvalidOperationException(secret)));

        Mock<IAgentEvaluationService> evaluationService = new();
        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();

        Mock<IBaselineMutationAuditService> baselineAudit = new();
        string? capturedRunFailedDetails = null;
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask)
            .Callback<string, string, string, string?, CancellationToken>(
                (_, _, _, details, _) => capturedRunFailedDetails = details);

        Mock<IAuditService> auditService = new();
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("exec-fail-actor");

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IUnifiedGoldenManifestReader> manifestReader = new(MockBehavior.Strict);

        ArchitectureRunExecuteOrchestrator sut = new(
            runRepo.Object,
            scopeProvider.Object,
            requestRepo.Object,
            taskRepo.Object,
            executor.Object,
            evaluationService.Object,
            resultRepo.Object,
            evalRepo.Object,
            evidenceRepo.Object,
            new DefaultEvidenceBuilder(manifestReader.Object),
            actorContext.Object,
            baselineAudit.Object,
            auditService.Object,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            new NoOpAgentOutputTraceEvaluationHook(),
            new NoOpEvidencePackageInjectionMitigator(),
            contentSafety.Object,
            Options.Create(new AgentOutputQualityGateOptions()),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<AgentHandlerExecutionException>();

        header.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Failed));
        header.CompletedUtc.Should().NotBeNull();
        header.LastFailureReason.Should().NotBeNullOrEmpty();
        header.LastFailureReason!.Should().NotContain(secret);

        AgentExecutionFailureSummary? persisted = AgentExecutionFailureSummaryJson.TryDeserialize(header.LastFailureReason);
        persisted.Should().NotBeNull();
        persisted.AgentTypeKey.Should().Be(AgentTypeKeys.Compliance);
        persisted.FailureClass.Should().Be(AgentExecutionFailureClasses.InvalidOperation);

        capturedRunFailedDetails.Should().NotBeNullOrEmpty();
        capturedRunFailedDetails!.Should().NotContain(secret);
        capturedRunFailedDetails.Should().Contain(AgentExecutionFailureClasses.InvalidOperation);
        capturedRunFailedDetails.Should().Contain(AgentTypeKeys.Compliance);

        runRepo.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(h => h.LastFailureReason != null && !h.LastFailureReason.Contains(secret)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        baselineAudit.Verify(
            b => b.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunFailed,
                "exec-fail-actor",
                runId,
                It.Is<string>(d => !d.Contains(secret)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
