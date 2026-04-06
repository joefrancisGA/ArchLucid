using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryCoordinatorGoldenManifestRepositoryContractTests : CoordinatorGoldenManifestRepositoryContractTests
{
    protected override ICoordinatorGoldenManifestRepository CreateRepository()
    {
        return new InMemoryCoordinatorGoldenManifestRepository();
    }
}
