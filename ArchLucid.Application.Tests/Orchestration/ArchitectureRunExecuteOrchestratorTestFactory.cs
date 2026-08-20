using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

public static class ArchitectureRunExecuteOrchestratorTestFactory
{
    internal static ArchitectureRunExecuteOrchestratorTailDependencies CreateStandardTailDependencies(
        IScopeContextProvider? scopeContextProvider = null,
        IRunRepository? runRepository = null)
    {
        IRunRepository runs = runRepository ?? Mock.Of<IRunRepository>();

        return new(
            CreateDefaultTopologyProposalSeeder(scopeContextProvider),
            CreatePermissiveDemoExpensiveActionGate(),
            CreatePassThroughRunScopedLlmBudgetReservationService(),
            new OperationCancellationRegistry(),
            new OperationRunCancellationMarker(runs),
            new DisabledRunExecuteOwnershipLeaseService(),
            Mock.Of<IRunStageOutcomesRepository>(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventOutbox(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventPublisher(),
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventsOptionsMonitor(),
            NullLogger<ArchitectureRunExecuteOrchestrator>.Instance);
    }

    internal static TechnologyLedgerTopologyProposalSeeder CreateDefaultTopologyProposalSeeder(
        IScopeContextProvider? scopeContextProvider = null) =>
        new(
            new InMemoryTechnologyLedgerRepository(),
            scopeContextProvider ?? Mock.Of<IScopeContextProvider>(),
            TimeProvider.System);

    internal static DemoExpensiveActionGate CreatePermissiveDemoExpensiveActionGate()
    {
        Mock<ITenantAiBudgetPolicyResolver> policyResolver = new();
        policyResolver
            .Setup(p => p.ResolveWorkspaceKindAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(AiUsageWorkspaceKind.Paid);

        Mock<IOptionsMonitor<AiUsageControlsOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(new AiUsageControlsOptions { DemoMode = false });

        return new DemoExpensiveActionGate(
            policyResolver.Object,
            optionsMonitor.Object);
    }

    internal static IRunScopedLlmBudgetReservationService CreatePassThroughRunScopedLlmBudgetReservationService() =>
        new PassThroughRunScopedLlmBudgetReservationService();

    internal static IOperationCancellationRegistry CreateDefaultCancellationRegistry() =>
        new OperationCancellationRegistry();

    internal static OperationRunCancellationMarker CreateRunCancellationMarker(IRunRepository runRepository) =>
        new(runRepository);

    internal static IIntegrationEventOutboxRepository CreateIntegrationEventOutbox() =>
        Mock.Of<IIntegrationEventOutboxRepository>();

    internal static IIntegrationEventPublisher CreateIntegrationEventPublisher() =>
        Mock.Of<IIntegrationEventPublisher>();

    internal static IOptionsMonitor<IntegrationEventsOptions> CreateIntegrationEventsOptionsMonitor()
    {
        Mock<IOptionsMonitor<IntegrationEventsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions());

        return options.Object;
    }
}
