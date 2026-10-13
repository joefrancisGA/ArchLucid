using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InMemoryVerifiedRemediationControlAssociationRepositoryContractTests
    : VerifiedRemediationControlAssociationRepositoryContractTests
{
    protected override IVerifiedRemediationControlAssociationRepository CreateRepository() =>
        new InMemoryVerifiedRemediationControlAssociationRepository();
}
