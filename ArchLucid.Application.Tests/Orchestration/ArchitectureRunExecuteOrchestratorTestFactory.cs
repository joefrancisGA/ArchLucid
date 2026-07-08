using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

internal static class ArchitectureRunExecuteOrchestratorTestFactory
{
    internal static TechnologyLedgerTopologyProposalSeeder CreateDefaultTopologyProposalSeeder(
        IScopeContextProvider? scopeContextProvider = null) =>
        new(
            new InMemoryTechnologyLedgerRepository(),
            scopeContextProvider ?? Mock.Of<IScopeContextProvider>(),
            TimeProvider.System);
}
