using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tests.Support;
using ArchLucid.TestSupport;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Coordination;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Core")]
public sealed class DapperRetrievalIndexingOutboxRetryContractTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Backoff_retries_keep_job_identity_and_allow_one_claim_per_job()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        // Claims are global within the outbox, so isolate this test from other queue rows.
        string connectionString = new SqlConnectionStringBuilder(fixture.ConnectionString)
        {
            InitialCatalog = "ArchLucidOutboxRetry_" + Guid.NewGuid().ToString("N"),
            Pooling = false,
        }.ConnectionString;
        try
        {
            await SqlServerTestCatalogCommands.EnsureCatalogExistsAsync(connectionString, CancellationToken.None);
            DatabaseMigrator.Run(connectionString);
            SqlConnectionFactory factory = new(connectionString);
            DapperRetrievalIndexingOutboxRepository repository = new(factory);
            DateTime due = DateTime.UtcNow.AddHours(1);

            await RetrievalOutboxRetryAssertions.VerifyAsync(repository, due, async outboxId =>
            {
                // Move only this fixture row past its deadline instead of sleeping or changing server time.
                await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
                int updated = await connection.ExecuteAsync("""
                    UPDATE dbo.RetrievalIndexingOutbox
                    SET NextAttemptUtc = DATEADD(SECOND, -1, SYSUTCDATETIME())
                    WHERE OutboxId = @outboxId AND NextAttemptUtc > SYSUTCDATETIME();
                    """, new { outboxId });
                updated.Should().Be(1);
            }, async (firstRun, nextRun) =>
            {
                await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
                foreach (Guid runId in new[] { firstRun, nextRun })
                {
                    await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(
                        connection, $"request-{runId:N}", runId.ToString("N"), CancellationToken.None);
                }
            });
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
        }
    }
}
