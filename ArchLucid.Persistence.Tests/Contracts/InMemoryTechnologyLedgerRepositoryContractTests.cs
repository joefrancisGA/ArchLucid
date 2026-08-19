using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTechnologyLedgerRepositoryContractTests : TechnologyLedgerRepositoryContractTests
{
    protected override ITechnologyLedgerRepository CreateRepository()
    {
        return new InMemoryTechnologyLedgerRepository();
    }
}
