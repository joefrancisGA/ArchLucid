using System.Collections.Concurrent;

using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.TestSupport;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class TenantDatabaseBindingConcurrencySqlIntegrationTests
{
    private const int FirstWriteTrials = 20;

    [SkippableFact]
    public async Task Concurrent_first_writes_for_same_tenant_leave_one_pending_binding()
    {
        await WithDisposableSystemCatalogAsync(async connectionString =>
        {
            for (int trial = 0; trial < FirstWriteTrials; trial++)
            {
                using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(45));
                CancellationToken ct = timeout.Token;
                Guid tenantId = Guid.NewGuid();
                string databaseName = "binding-" + tenantId.ToString("N");
                await SeedTenantAsync(connectionString, tenantId, ct);
                DapperTenantDatabaseBindingRepository reader =
                    new(new DedicatedSystemSqlConnectionFactory(connectionString));
                Assert.Null(await reader.GetByTenantIdAsync(tenantId, ct));

                await RunContendingUpsertsAsync(connectionString, tenantId, databaseName, ct);

                await AssertSinglePendingBindingAsync(connectionString, tenantId, databaseName, ct);
            }
        });
    }

    [SkippableFact]
    public async Task Concurrent_updates_of_failed_binding_clear_error_and_preserve_creation_time()
    {
        await WithDisposableSystemCatalogAsync(async connectionString =>
        {
            using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(45));
            CancellationToken ct = timeout.Token;
            Guid tenantId = Guid.NewGuid();
            await SeedTenantAsync(connectionString, tenantId, ct);
            DapperTenantDatabaseBindingRepository repository =
                new(new DedicatedSystemSqlConnectionFactory(connectionString));
            await repository.UpsertPendingAsync(tenantId, "old-binding", ct);
            await repository.MarkFailedAsync(tenantId, "previous provisioning error", ct);
            TenantDatabaseBindingRecord before = Assert.IsType<TenantDatabaseBindingRecord>(
                await repository.GetByTenantIdAsync(tenantId, ct));
            Assert.Equal(TenantDatabaseProvisioningState.Failed, before.ProvisioningState);
            Assert.Equal("previous provisioning error", before.LastError);
            DateTimeOffset createdUtc = await ReadCreatedUtcAsync(connectionString, tenantId, ct);

            const string newName = "replacement-binding";
            await RunContendingUpsertsAsync(connectionString, tenantId, newName, ct);

            await AssertSinglePendingBindingAsync(connectionString, tenantId, newName, ct);
            Assert.Equal(createdUtc, await ReadCreatedUtcAsync(connectionString, tenantId, ct));
        });
    }

    private static async Task WithDisposableSystemCatalogAsync(Func<string, Task> test)
    {
        // Reuse the topology integration tests' ephemeral catalog resolver and real system migrations.
        // Do not silently skip configured SQL failures (including migration failures).
        Skip.If(
            !OperatingSystem.IsWindows()
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)),
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string name = "ArchLucidBindingRace" + Guid.NewGuid().ToString("N");
        string connectionString = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(name);
        SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
        try
        {
            DatabaseMigrator.RunSystem(connectionString);
            await test(connectionString);
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
        }
    }

    private static async Task SeedTenantAsync(string connectionString, Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO dbo.Tenants (Id, Name, Slug, Tier)
            VALUES (@Id, N'Binding concurrency tenant', @Slug, N'Standard');
            """,
            new { Id = tenantId, Slug = "binding-race-" + tenantId.ToString("N") },
            cancellationToken: ct));
    }

    private static async Task RunContendingUpsertsAsync(
        string connectionString, Guid tenantId, string databaseName, CancellationToken ct)
    {
        // Two independent production repository instances share only a test start gate.
        // Open both connections before releasing either to execute the real MERGE.
        ConcurrentStartFactory gate = new(new DedicatedSystemSqlConnectionFactory(connectionString));
        DapperTenantDatabaseBindingRepository first = new(gate);
        DapperTenantDatabaseBindingRepository second = new(gate);
        await Task.WhenAll(
            first.UpsertPendingAsync(tenantId, databaseName, ct),
            second.UpsertPendingAsync(tenantId, databaseName, ct));
        Assert.Equal(2, gate.SessionIds.Count);
        Assert.Equal(2, gate.SessionIds.Distinct().Count());
    }

    private static async Task AssertSinglePendingBindingAsync(
        string connectionString, Guid tenantId, string databaseName, CancellationToken ct)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(ct);
        int count = await connection.QuerySingleAsync<int>(new CommandDefinition(
            "SELECT COUNT(*) FROM dbo.TenantDatabaseBindings WHERE TenantId = @Id;",
            new { Id = tenantId }, cancellationToken: ct));
        Assert.Equal(1, count);
        DapperTenantDatabaseBindingRepository repository =
            new(new DedicatedSystemSqlConnectionFactory(connectionString));
        TenantDatabaseBindingRecord record = Assert.IsType<TenantDatabaseBindingRecord>(
            await repository.GetByTenantIdAsync(tenantId, ct));
        Assert.Equal(tenantId, record.TenantId);
        Assert.Equal(databaseName, record.SqlLogicalDatabaseName);
        Assert.Equal(TenantDatabaseProvisioningState.Pending, record.ProvisioningState);
        Assert.Null(record.LastError);
    }

    private static async Task<DateTimeOffset> ReadCreatedUtcAsync(
        string connectionString, Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(ct);
        return await connection.QuerySingleAsync<DateTimeOffset>(new CommandDefinition(
            "SELECT CreatedUtc FROM dbo.TenantDatabaseBindings WHERE TenantId = @Id;",
            new { Id = tenantId }, cancellationToken: ct));
    }

    private sealed class ConcurrentStartFactory(ISystemSqlConnectionFactory inner) : ISystemSqlConnectionFactory
    {
        private readonly TaskCompletionSource<bool> _bothReady = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _arrivals;

        public string SystemConnectionString => inner.SystemConnectionString;

        public ConcurrentBag<int> SessionIds { get; } = new();

        public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken)
        {
            SqlConnection connection = await inner.CreateOpenConnectionAsync(cancellationToken);
            try
            {
                SessionIds.Add(await connection.QuerySingleAsync<int>(new CommandDefinition(
                    "SELECT CONVERT(int, @@SPID);", cancellationToken: cancellationToken)));
                if (Interlocked.Increment(ref _arrivals) == 2)
                    _bothReady.TrySetResult(true);

                await _bothReady.Task.WaitAsync(cancellationToken);
                return connection;
            }
            catch
            {
                await connection.DisposeAsync();
                throw;
            }
        }
    }
}
