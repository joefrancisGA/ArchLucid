using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.ApplicationPorts.IntegrationOutbox;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

/// <summary>
/// Audit behavior on architecture run execute and commit orchestrators when runs are missing.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArchitectureRunOrchestrationAuditTests
{
    private static readonly ScopeContext AuthorityTestScope = new()
    {
        TenantId = Guid.Parse("99999999-9999-9999-9999-999999999991"),
        WorkspaceId = Guid.Parse("99999999-9999-9999-9999-999999999992"),
        ProjectId = Guid.Parse("99999999-9999-9999-9999-999999999993")
    };

    [SkippableFact]
    public async Task ExecuteRun_RunNotFound_RecordsRunFailedThenThrows()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(AuthorityTestScope);
        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(r => r.GetByIdAsync(AuthorityTestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("audit-actor");

        Mock<IBaselineMutationAuditService> audit = new();
        Mock<IAuditService> durableAudit = new();
        Mock<IRequestContentSafetyPrecheck> contentSafety = new();
        contentSafety
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        ArchitectureRunExecuteOrchestrator sut = CreateExecuteOrchestrator(
            runRepo.Object,
            scopeProvider.Object,
            actor.Object,
            audit.Object,
            durableAudit.Object,
            contentSafety.Object);

        Func<Task> act = () => sut.ExecuteRunAsync("missing");

        await act.Should().ThrowAsync<RunNotFoundException>();

        durableAudit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);

        audit.Verify(
            a => a.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunFailed,
                "audit-actor",
                "missing",
                "Run not found.",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task CommitRun_PropagatesRunNotFoundFromOrchestrator()
    {
        IArchitectureRunCommitOrchestrator commit = BuildCommitOrchestratorThatThrowsRunNotFound();

        Func<Task> act = () => commit.CommitRunAsync("missing");

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    private static ArchitectureRunExecuteOrchestrator CreateExecuteOrchestrator(
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IActorContext actorContext,
        IBaselineMutationAuditService baselineMutationAudit,
        IAuditService auditService,
        IRequestContentSafetyPrecheck? requestContentSafetyPrecheck = null)
    {
        IRequestContentSafetyPrecheck precheck = requestContentSafetyPrecheck ?? BuildAllowAllPrecheck();

        return new ArchitectureRunExecuteOrchestrator(
            runRepository,
            scopeContextProvider,
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IAgentExecutor>(),
            Mock.Of<IAgentEvaluationService>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentEvaluationRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IEvidenceBuilder>(),
            actorContext,
            baselineMutationAudit,
            auditService,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            new NoOpAgentOutputTraceEvaluationHook(),
            new ArchLucid.Application.Agents.Evidence.NoOpAgentResultPostExecutionEnricher(),
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            precheck,
            Options.Create(new AgentExecutionOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new RunStateTransitionService(),
            Mock.Of<IRunEngineProvenanceCaptureService>(),
            new TechnologyLedgerTopologyProposalSeeder(
                new InMemoryTechnologyLedgerRepository(),
                scopeContextProvider,
                TimeProvider.System),
            new DemoExpensiveActionGate(
                BuildPermissiveAiBudgetPolicyResolver(),
                BuildDemoModeOffOptionsMonitor()),
            new ArchLucid.Application.Budgeting.PassThroughRunScopedLlmBudgetReservationService(),
            new OperationCancellationRegistry(),
            new OperationRunCancellationMarker(runRepository),
            new DisabledRunExecuteOwnershipLeaseService(),
            Mock.Of<IRunStageOutcomesRepository>(),
            Mock.Of<IIntegrationEventOutboxRepository>(),
            Mock.Of<IIntegrationEventPublisher>(),
            CreateIntegrationEventsOptionsMonitor(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }

    private static IOptionsMonitor<IntegrationEventsOptions> CreateIntegrationEventsOptionsMonitor()
    {
        Mock<IOptionsMonitor<IntegrationEventsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions());

        return options.Object;
    }

    private static ITenantAiBudgetPolicyResolver BuildPermissiveAiBudgetPolicyResolver()
    {
        Mock<ITenantAiBudgetPolicyResolver> policyResolver = new();
        policyResolver
            .Setup(p => p.ResolveWorkspaceKindAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(AiUsageWorkspaceKind.Paid);

        return policyResolver.Object;
    }

    private static IOptionsMonitor<AiUsageControlsOptions> BuildDemoModeOffOptionsMonitor()
    {
        Mock<IOptionsMonitor<AiUsageControlsOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(new AiUsageControlsOptions { DemoMode = false });

        return optionsMonitor.Object;
    }

    private static IRequestContentSafetyPrecheck BuildAllowAllPrecheck()
    {
        Mock<IRequestContentSafetyPrecheck> mock = new();
        mock
            .Setup(p => p.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });
        return mock.Object;
    }

    private static IArchitectureRunCommitOrchestrator BuildCommitOrchestratorThatThrowsRunNotFound()
    {
        Mock<IArchitectureRunCommitOrchestrator> commit = new();
        commit
            .Setup(c => c.CommitRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((runId, _) => throw new RunNotFoundException(runId));

        return commit.Object;
    }
}
