using System.Diagnostics;
using System.Text.Json;

using Dapper;
using FluentAssertions;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
/// Opt-in SQL lock-timeout / rollback / retry drill on an isolated test catalog.
/// Uses a unique global temporary table; never locks application tables.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "FaultInjection")]
public sealed class SqlDependencyRecoveryDrillTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Timed_out_write_recovers_without_corrupting_data()
    {
        Skip.IfNot(
            Environment.GetEnvironmentVariable("ARCHLUCID_ENABLE_SQL_FAULT_DRILL")
                == "I_APPROVE_DISPOSABLE_SQL_FAULT_DRILL",
            "Explicit disposable SQL fault drill opt-in required.");
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionStringBuilder builder = new(fixture.ConnectionString);
        Skip.IfNot(builder.InitialCatalog.StartsWith("ArchLucidFaultTest_", StringComparison.Ordinal),
            "SQL fault drills require an explicitly named ArchLucidFaultTest_* disposable catalog.");

        // A unique global temporary table is accessible to both connections and
        // is automatically discarded when no sessions reference it.
        string table = "##ArchLucidRecovery_" + Guid.NewGuid().ToString("N");
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(30));
        CancellationToken ct = timeout.Token;
        await using SqlConnection blocker = new(fixture.ConnectionString);
        await using SqlConnection contender = new(fixture.ConnectionString);
        await blocker.OpenAsync(ct);
        await contender.OpenAsync(ct);
        await blocker.ExecuteAsync(new CommandDefinition(
            $"CREATE TABLE {table} (Id int NOT NULL PRIMARY KEY, Value int NOT NULL); INSERT INTO {table} VALUES (1, 10);",
            cancellationToken: ct));
        try
        {
            await using SqlTransaction held = (SqlTransaction)await blocker.BeginTransactionAsync(ct);
            try
            {
                int heldRows = await blocker.ExecuteAsync(new CommandDefinition(
                    $"UPDATE {table} SET Value = 20 WHERE Id = 1;",
                    transaction: held, cancellationToken: ct));
                heldRows.Should().Be(1);
                await contender.ExecuteAsync(new CommandDefinition("SET LOCK_TIMEOUT 500;", cancellationToken: ct));
                Stopwatch sw = Stopwatch.StartNew();
                SqlException? failure = null;
                try
                {
                    await contender.ExecuteAsync(new CommandDefinition(
                        $"UPDATE {table} SET Value = 30 WHERE Id = 1;", cancellationToken: ct));
                }
                catch (SqlException ex) when (ex.Number == 1222)
                {
                    failure = ex;
                }
                sw.Stop();
                failure.Should().NotBeNull("a held SQL row lock must trigger lock timeout 1222");
                await held.RollbackAsync(ct);

                int baseline = await contender.QuerySingleAsync<int>(new CommandDefinition(
                    $"SELECT Value FROM {table} WHERE Id = 1;", cancellationToken: ct));
                baseline.Should().Be(10, "the blocked transaction was rolled back");

                Stopwatch recovery = Stopwatch.StartNew();
                int changed = await contender.ExecuteAsync(new CommandDefinition(
                    $"UPDATE {table} SET Value = 30 WHERE Id = 1;", cancellationToken: ct));
                recovery.Stop();
                changed.Should().Be(1);
                int after = await contender.QuerySingleAsync<int>(new CommandDefinition(
                    $"SELECT Value FROM {table} WHERE Id = 1;", cancellationToken: ct));
                after.Should().Be(30, "a successful retry must persist exactly the intended value");

                string? path = Environment.GetEnvironmentVariable("ARCHLUCID_SQL_FAULT_DRILL_OUTPUT");
                if (!string.IsNullOrWhiteSpace(path))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
                    await File.WriteAllTextAsync(path, JsonSerializer.Serialize(new
                    {
                        schemaVersion = 1,
                        profile = "disposable-sql-row-lock-recovery",
                        status = "pass",
                        injectedFailure = "SQL lock timeout 1222",
                        blockedWriteMilliseconds = sw.Elapsed.TotalMilliseconds,
                        retryMilliseconds = recovery.Elapsed.TotalMilliseconds,
                        baselineValue = baseline,
                        recoveredValue = after,
                        disposableCatalog = builder.InitialCatalog,
                        limitations = "SQL-only rollback/retry evidence; not application dependency failover."
                    }, new JsonSerializerOptions { WriteIndented = true }), ct);
                }
            }
            finally
            {
                // Transaction disposal rolls back if an assertion or SQL operation fails.
            }
        }
        finally
        {
            await blocker.ExecuteAsync($"DROP TABLE IF EXISTS {table};");
        }
    }
}
