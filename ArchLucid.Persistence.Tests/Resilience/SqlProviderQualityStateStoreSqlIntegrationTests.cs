using System.Collections.Concurrent;
using System.Text.Json;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Resilience;
using ArchLucid.TestSupport;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Resilience;

[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SqlProviderQualityStateStoreSqlIntegrationTests
{
    [SkippableFact]
    public async Task Two_sessions_serialize_first_write_and_preserve_the_committed_aggregate()
    {
        await WithDisposableSystemCatalogAsync(async connectionString =>
        {
            DedicatedSystemSqlConnectionFactory sql = new(connectionString);
            for (int trial = 0; trial < 8; trial++)
            {
                using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(30));
                CancellationToken ct = timeout.Token;
                string key = NewDeploymentKey();
                ConcurrentStartFactory gate = new(sql);
                SqlProviderQualityStateStore first = new(gate);
                SqlProviderQualityStateStore second = new(gate);

                int[] observed = await Task.WhenAll(
                    first.UpdateAsync<int>(key, Increment, ct),
                    second.UpdateAsync<int>(key, Increment, ct));

                Assert.Equal(2, gate.SessionIds.Distinct().Count());
                Assert.Equal(new[] { 1, 2 }, observed.Order().ToArray());

                // A new adapter with its own connection must observe the committed result.
                SqlProviderQualityStateStore recreated = new(sql);
                Assert.Equal(2, await recreated.UpdateAsync<int>(key, Read, ct));
            }
        });
    }

    [SkippableFact]
    public async Task Recovery_lease_claim_has_one_winner_and_does_not_affect_another_deployment()
    {
        await WithDisposableSystemCatalogAsync(async connectionString =>
        {
            using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(30));
            CancellationToken ct = timeout.Token;
            DedicatedSystemSqlConnectionFactory sql = new(connectionString);
            string quarantined = NewDeploymentKey();
            string unrelated = NewDeploymentKey();
            SqlProviderQualityStateStore setup = new(sql);
            await setup.UpdateAsync<bool>(quarantined, _ => ("{\"leased\":false}", true), ct);
            ConcurrentStartFactory gate = new(sql);
            SqlProviderQualityStateStore first = new(gate);
            SqlProviderQualityStateStore second = new(gate);

            bool[] claims = await Task.WhenAll(
                first.UpdateAsync<bool>(quarantined, ClaimLease, ct),
                second.UpdateAsync<bool>(quarantined, ClaimLease, ct));

            Assert.Equal(2, gate.SessionIds.Distinct().Count());
            Assert.Single(claims, static won => won);
            SqlProviderQualityStateStore restarted = new(sql);
            Assert.False(await restarted.UpdateAsync<bool>(quarantined, ClaimLease, ct));
            Assert.True(await restarted.UpdateAsync<bool>(unrelated, payload => (null, payload is null), ct));
        });
    }

    private static string NewDeploymentKey() =>
        Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

    private static (string? Replacement, int Result) Increment(string? payload)
    {
        int next = Read(payload).Result + 1;
        return (JsonSerializer.Serialize(new[] { next }), next);
    }

    private static (string? Replacement, int Result) Read(string? payload) =>
        (null, payload is null ? 0 : JsonSerializer.Deserialize<int[]>(payload)![0]);

    private static (string? Replacement, bool Result) ClaimLease(string? payload)
    {
        using JsonDocument row = JsonDocument.Parse(payload ?? throw new InvalidOperationException("Missing quarantine state."));
        return row.RootElement.GetProperty("leased").GetBoolean()
            ? (null, false)
            : ("{\"leased\":true}", true);
    }

    private static async Task WithDisposableSystemCatalogAsync(Func<string, Task> test)
    {
        Skip.If(
            !OperatingSystem.IsWindows()
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)),
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string name = "ArchLucidProviderQuality" + Guid.NewGuid().ToString("N");
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

    private sealed class ConcurrentStartFactory(ISystemSqlConnectionFactory inner) : ISystemSqlConnectionFactory
    {
        private readonly TaskCompletionSource<bool> _ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
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
                    _ready.TrySetResult(true);

                await _ready.Task.WaitAsync(cancellationToken);
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
