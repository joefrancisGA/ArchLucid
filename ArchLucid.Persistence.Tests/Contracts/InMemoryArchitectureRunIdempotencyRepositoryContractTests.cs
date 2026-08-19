using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryArchitectureRunIdempotencyRepositoryContractTests
    : ArchitectureRunIdempotencyRepositoryContractTests
{
    protected override IArchitectureRunIdempotencyRepository CreateRepository()
    {
        return new InMemoryArchitectureRunIdempotencyRepository();
    }
}
