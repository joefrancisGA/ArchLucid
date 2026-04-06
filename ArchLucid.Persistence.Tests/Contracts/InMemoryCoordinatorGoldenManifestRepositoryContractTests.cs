using ArchiForge.Persistence.Data.Repositories;

namespace ArchiForge.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryCoordinatorGoldenManifestRepositoryContractTests : CoordinatorGoldenManifestRepositoryContractTests
{
    protected override ICoordinatorGoldenManifestRepository CreateRepository()
    {
        return new InMemoryCoordinatorGoldenManifestRepository();
    }
}
