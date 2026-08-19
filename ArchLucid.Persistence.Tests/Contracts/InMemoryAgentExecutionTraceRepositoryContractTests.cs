using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAgentExecutionTraceRepositoryContractTests : AgentExecutionTraceRepositoryContractTests
{
    protected override IAgentExecutionTraceRepository CreateRepository()
    {
        return new InMemoryAgentExecutionTraceRepository();
    }
}
