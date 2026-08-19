using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAgentEvidencePackageRepositoryContractTests : AgentEvidencePackageRepositoryContractTests
{
    protected override IAgentEvidencePackageRepository CreateRepository()
    {
        return new InMemoryAgentEvidencePackageRepository();
    }
}
