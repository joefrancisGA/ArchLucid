using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="ProvenanceSnapshotRepositoryContractTests" /> against
///     <see cref="SqlProvenanceSnapshotRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperProvenanceSnapshotRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : ProvenanceSnapshotRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IProvenanceSnapshotRepository CreateRepository()
    {
        return new SqlProvenanceSnapshotRepository(new TestSqlConnectionFactory(fixture.ConnectionString));
    }

    protected override async Task EnsureRunRowAsync(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1"),
            WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"),
            ProjectId = Guid.Parse("b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3"),
        };

        string requestId = "prov-snap-req-" + runId.ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(
            connection,
            requestId,
            runId.ToString("N"),
            scope,
            cancellationToken);
    }
}
