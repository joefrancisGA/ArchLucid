using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Decisioning.Decisions;
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

/// <summary>Blocking posture when <see cref="AgentOutputQualityGateOptions.BlockRunOnReject" /> is enabled.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorQualityGateBlockingTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [SkippableFact]
    public async Task ExecuteRunAsync_when_trace_hook_throws_quality_gate_marks_run_and_skips_RunFailed_audit()
    {
        Guid runGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string runId = runGuid.ToString("N");

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureRequestId = "req-qgate-block",
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-qgate-block",
            Description = new string('x', 12),
            SystemName = "QGateBlock",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        RunRecord? updateCapture = null;
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (rec, _, _, _) => updateCapture = rec)
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo.Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>())).ReturnsAsync(request);

        Mock<IAgentTaskRepository> taskRepo = new();
        taskRepo
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentTask
                {
                    RunId = runId,
                    AgentType = AgentType.Topology,
                    TaskId = Guid.NewGuid().ToString("N"),
                },
            ]);

        IReadOnlyList<AgentResult> fourResults = BuildFourResults(runId);

        Mock<IAgentExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(
                runId,
                request,
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentTask>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(fourResults);

        Mock<IAgentEvaluationService> evaluationService = new();
        evaluationService
            .Setup(e => e.EvaluateAsync(
                runId,
                request,
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyCollection<AgentTask>>(),
                It.IsAny<IReadOnlyCollection<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultRepository> resultRepo = new();
        resultRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), null, null)).ReturnsAsync([]);
        resultRepo
            .Setup(r => r.CreateManyAsync(It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IAgentEvaluationRepository> evalRepo = new();
        evalRepo
            .Setup(r => r.CreateManyAsync(
                It.IsAny<IReadOnlyCollection<AgentEvaluationRecord>>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        evidenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<AgentEvidencePackage>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("qgate-actor");

        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IUnifiedGoldenManifestReader> manifestReader = new(MockBehavior.Strict);

        Mock<IAgentOutputTraceEvaluationHook> traceHook = new();
        traceHook
            .Setup(h => h.AfterSuccessfulExecuteAsync(runId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AgentOutputQualityGateRejectedException(runId, "tr-block-1", nameof(AgentType.Topology)));

        IOptions<AgentOutputQualityGateOptions> gateOptions = Options.Create(new AgentOutputQualityGateOptions
        {
            BlockRunOnReject = true,
            EnforceOnReject = true,
        });

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
            traceHook.Object,
            new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            contentSafety.Object,
            Options.Create(new AgentExecutionOptions()),
            gateOptions,
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);

        Func<Task> act = async () => await sut.ExecuteRunAsync(runId);

        await act.Should().ThrowAsync<AgentOutputQualityGateRejectedException>();

        updateCapture.Should().NotBeNull();
        updateCapture!.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected));

        baselineAudit.Verify(
            b => b.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunQualityGateRejected,
                "qgate-actor",
                runId,
                It.Is<string>(s => s.Contains("tr-block-1", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        baselineAudit.Verify(
            b => b.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunFailed,
                It.IsAny<string>(),
                runId,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        auditService.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.RunLegacyReadyForCommitPromoted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static List<AgentResult> BuildFourResults(string runId)
    {
        AgentType[] types = [AgentType.Topology, AgentType.Cost, AgentType.Compliance, AgentType.Critic];

        return types
            .Select(t => new AgentResult
            {
                RunId = runId,
                AgentType = t,
                TaskId = $"{t}-{Guid.NewGuid():N}",
                Claims = ["c"],
                EvidenceRefs = ["e"],
                Confidence = 0.9,
            })
            .ToList();
    }
}
