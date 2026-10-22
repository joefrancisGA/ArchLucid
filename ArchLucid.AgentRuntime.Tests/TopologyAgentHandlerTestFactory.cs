using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

internal static class TopologyAgentHandlerTestFactory
{
    internal static ITechnologyLedgerRepository CreateEmptyLedgerRepository()
    {
        Mock<ITechnologyLedgerRepository> repository = new();
        repository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return repository.Object;
    }
}
