using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

public static class ArchitectureRunExecuteOrchestratorTestFactory
{
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
}
