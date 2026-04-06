using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryCoordinatorDecisionTraceRepositoryContractTests : CoordinatorDecisionTraceRepositoryContractTests
{
    protected override ICoordinatorDecisionTraceRepository CreateRepository()
    {
        return new InMemoryCoordinatorDecisionTraceRepository();
    }
}
