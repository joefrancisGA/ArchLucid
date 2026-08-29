using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Identity;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="SelfServiceTrialAbuseRepositoryContractTests" /> against
///     <see cref="DapperSelfServiceTrialAbuseRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperSelfServiceTrialAbuseRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : SelfServiceTrialAbuseRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override ISelfServiceTrialAbuseRepository CreateRepository() =>
        new DapperSelfServiceTrialAbuseRepository(new SqlConnectionFactory(fixture.ConnectionString));
}
