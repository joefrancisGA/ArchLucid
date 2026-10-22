using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryArchitectureRequestRepositoryContractTests : ArchitectureRequestRepositoryContractTests
{
    protected override IArchitectureRequestRepository CreateRepository()
    {
        return new InMemoryArchitectureRequestRepository();
    }
}
