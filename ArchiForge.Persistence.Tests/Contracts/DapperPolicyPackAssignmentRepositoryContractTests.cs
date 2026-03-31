using ArchiForge.Decisioning.Governance.PolicyPacks;
using ArchiForge.Persistence.Connections;
using ArchiForge.Persistence.Governance;

namespace ArchiForge.Persistence.Tests.Contracts;

/// <summary>
/// Runs <see cref="PolicyPackAssignmentRepositoryContractTests"/> against <see cref="DapperPolicyPackAssignmentRepository"/>.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperPolicyPackAssignmentRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : PolicyPackAssignmentRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IPolicyPackAssignmentRepository CreateRepository()
    {
        return new DapperPolicyPackAssignmentRepository(new SqlConnectionFactory(fixture.ConnectionString));
    }
}
