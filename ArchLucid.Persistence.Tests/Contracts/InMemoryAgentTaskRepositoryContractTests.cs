using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAgentTaskRepositoryContractTests : AgentTaskRepositoryContractTests
{
    protected override IAgentTaskRepository CreateRepository()
    {
        return new InMemoryAgentTaskRepository();
    }
}
