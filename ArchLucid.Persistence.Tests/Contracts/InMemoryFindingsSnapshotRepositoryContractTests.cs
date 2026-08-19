using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Persistence.Tests.Support;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="FindingsSnapshotRepositoryContractTests" /> against
///     <see cref="InMemoryFindingsSnapshotRepository" /> with a fixed ambient scope.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryFindingsSnapshotRepositoryContractTests : FindingsSnapshotRepositoryContractTests
{
    private static readonly ScopeContext ContractScope = new()
    {
        TenantId = Guid.Parse("c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1"),
        WorkspaceId = Guid.Parse("c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2"),
        ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3"),
    };

    protected override IFindingsSnapshotRepository CreateRepository()
    {
        return new InMemoryFindingsSnapshotRepository(new FixedPersistenceScopeContextProvider(ContractScope));
    }
}
