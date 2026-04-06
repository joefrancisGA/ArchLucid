using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAgentResultRepositoryContractTests : AgentResultRepositoryContractTests
{
    protected override IAgentResultRepository CreateRepository()
    {
        return new InMemoryAgentResultRepository();
    }
}
