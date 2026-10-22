using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryDecisionNodeRepositoryContractTests : DecisionNodeRepositoryContractTests
{
    protected override IDecisionNodeRepository CreateRepository()
    {
        return new InMemoryDecisionNodeRepository();
    }
}
