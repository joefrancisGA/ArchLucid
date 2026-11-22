using System.Collections.Concurrent;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.SqlClient;

if (args.Contains("--help"))
{
    Console.WriteLine("Requires ARCHLUCID_SQL_BENCH_CONNECTION, --database ArchLucidCapacityTest_*, --approval I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES, --output path; optional --rows 1000 --workers 4 --seconds 30");
    return 0;
}
string Get(string key, string fallback = "") =>
    Array.IndexOf(args, key) is var i && i >= 0 && i + 1 < args.Length ? args[i + 1] : fallback;
string database = Get("--database");
string approval = Get("--approval");
string output = Get("--output");
if (!database.StartsWith("ArchLucidCapacityTest_", StringComparison.Ordinal)
    || approval != "I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES" || string.IsNullOrWhiteSpace(output))
    throw new InvalidOperationException("Dedicated ArchLucidCapacityTest_* database, explicit approval and output are required.");
int rows = int.Parse(Get("--rows", "1000"));
int workers = int.Parse(Get("--workers", "4"));
int seconds = int.Parse(Get("--seconds", "30"));
if (rows is < 1 or > 1000 || workers is < 1 or > 4 || seconds is < 1 or > 60)
    throw new ArgumentOutOfRangeException(nameof(args), "Smoke profile limits: rows 1..1000, workers 1..4, seconds 1..60.");
string? rawConnection = Environment.GetEnvironmentVariable("ARCHLUCID_SQL_BENCH_CONNECTION");
if (string.IsNullOrWhiteSpace(rawConnection)) throw new InvalidOperationException("Missing SQL benchmark connection environment variable.");
SqlConnectionStringBuilder builder = new(rawConnection);
if (!string.Equals(builder.InitialCatalog, database, StringComparison.OrdinalIgnoreCase)
    || !builder.Encrypt.Equals(SqlConnectionEncryptOption.Mandatory) && !builder.Encrypt.Equals(SqlConnectionEncryptOption.Strict)
    || builder.TrustServerCertificate)
    throw new InvalidOperationException("Connection catalog must match the isolated database; encrypted verified TLS is mandatory.");
builder.ConnectTimeout = Math.Min(builder.ConnectTimeout, 15);
string connectionString = builder.ConnectionString;
using CancellationTokenSource timeout = new(TimeSpan.FromMinutes(10));
CancellationToken ct = timeout.Token;
Guid batch = Guid.NewGuid();
const string table = "dbo.ArchLucidSqlSmokeRuns";
await using (SqlConnection setup = new(connectionString))
{
    await setup.OpenAsync(ct);
    await using SqlCommand create = new($"""
        IF OBJECT_ID('{table}', 'U') IS NULL
        BEGIN
          CREATE TABLE {table} (
            BatchId uniqueidentifier NOT NULL,
            RunId uniqueidentifier NOT NULL,
            TenantId uniqueidentifier NOT NULL,
            WorkspaceId uniqueidentifier NOT NULL,
            Version int NOT NULL DEFAULT 0,
            Payload nvarchar(128) NOT NULL,
            CONSTRAINT PK_ArchLucidSqlSmokeRuns PRIMARY KEY (BatchId, RunId)
          );
          CREATE INDEX IX_ArchLucidSqlSmokeRuns_Scope ON {table} (BatchId, TenantId, WorkspaceId);
        END
        """, setup);
    await create.ExecuteNonQueryAsync(ct);
    // Deterministic synthetic IDs per batch, with batch isolation for parallel invocations.
    for (int i = 0; i < rows; i++)
    {
        byte[] bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"archlucid-smoke-{i}"));
        Guid runId = new(bytes.AsSpan(0, 16));
        await using SqlCommand insert = new($"""
            INSERT INTO {table} (BatchId, RunId, TenantId, WorkspaceId, Payload)
            VALUES (@batch, @run, @tenant, @workspace, @payload)
            """, setup);
        insert.Parameters.AddWithValue("@batch", batch);
        insert.Parameters.AddWithValue("@run", runId);
        insert.Parameters.AddWithValue("@tenant", Guid.Parse("11111111-1111-1111-1111-111111111111"));
        insert.Parameters.AddWithValue("@workspace", Guid.Parse("22222222-2222-2222-2222-222222222222"));
        insert.Parameters.AddWithValue("@payload", $"fixture-{i:D4}");
        await insert.ExecuteNonQueryAsync(ct);
    }
}
ConcurrentBag<double> readMs = new(), updateMs = new();
ConcurrentBag<string> errors = new();
DateTimeOffset start = DateTimeOffset.UtcNow;
try
{
    using CancellationTokenSource measurement = CancellationTokenSource.CreateLinkedTokenSource(ct);
    measurement.CancelAfter(TimeSpan.FromSeconds(seconds));
    await Task.WhenAll(Enumerable.Range(0, workers).Select(async worker =>
    {
        try
        {
            await using SqlConnection conn = new(connectionString);
            await conn.OpenAsync(ct);
            int sequence = worker;
            while (!measurement.IsCancellationRequested)
            {
                byte[] bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"archlucid-smoke-{sequence % rows}"));
                Guid runId = new(bytes.AsSpan(0, 16));
                bool write = sequence % 5 == 0;
                Stopwatch sw = Stopwatch.StartNew();
                await using SqlCommand command = new(write
                    ? $"UPDATE {table} SET Version = Version + 1 WHERE BatchId = @batch AND RunId = @run AND TenantId = @tenant AND WorkspaceId = @workspace"
                    : $"SELECT Version FROM {table} WHERE BatchId = @batch AND RunId = @run", conn);
                command.Parameters.AddWithValue("@batch", batch);
                command.Parameters.AddWithValue("@run", runId);
                command.Parameters.AddWithValue("@tenant", Guid.Parse("11111111-1111-1111-1111-111111111111"));
                command.Parameters.AddWithValue("@workspace", Guid.Parse("22222222-2222-2222-2222-222222222222"));
                try
                {
                    if (write)
                    {
                        if (await command.ExecuteNonQueryAsync(ct) != 1) throw new InvalidOperationException("Update row missing");
                        updateMs.Add(sw.Elapsed.TotalMilliseconds);
                    }
                    else
                    {
                        if (await command.ExecuteScalarAsync(ct) is null) throw new InvalidOperationException("Read row missing");
                        readMs.Add(sw.Elapsed.TotalMilliseconds);
                    }
                }
                catch (Exception ex) when (ex is SqlException or InvalidOperationException)
                {
                    errors.Add(ex.GetType().Name);
                }
                sequence += workers;
            }
        }
        catch (Exception ex) when (ex is SqlException or InvalidOperationException)
        {
            errors.Add(ex.GetType().Name);
        }
    }));
}
finally
{
    // Only this invocation's rows may be removed; preserve other concurrent benchmark batches.
    await using SqlConnection cleanup = new(connectionString);
    await cleanup.OpenAsync(CancellationToken.None);
    await using SqlCommand delete = new($"DELETE FROM {table} WHERE BatchId = @batch", cleanup);
    delete.CommandTimeout = 60;
    delete.Parameters.AddWithValue("@batch", batch);
    await delete.ExecuteNonQueryAsync(CancellationToken.None);
}
static object Stats(ConcurrentBag<double> samples)
{
    double[] sorted = samples.Order().ToArray();
    double Percentile(double p) => sorted.Length == 0 ? 0 : sorted[Math.Min(sorted.Length - 1, (int)Math.Ceiling(p * sorted.Length) - 1)];
    return new { count = sorted.Length, p50Ms = Percentile(.5), p95Ms = Percentile(.95), p99Ms = Percentile(.99) };
}
var result = new {
    schemaVersion = 1, profile = "smoke", datasetRows = rows, concurrency = workers,
    requestedSeconds = seconds, elapsedSeconds = (DateTimeOffset.UtcNow - start).TotalSeconds,
    batchId = batch, database, generatedUtc = DateTimeOffset.UtcNow,
    commit = Environment.GetEnvironmentVariable("GITHUB_SHA") ?? "unknown",
    operations = new { scopedRead = Stats(readMs), conditionalUpdate = Stats(updateMs) },
    errorCount = errors.Count, errorsByType = errors.GroupBy(x => x).ToDictionary(x => x.Key, x => x.Count()),
    caveat = "Isolated SQL fixture benchmark; not yet production repository API performance."
};
Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(output))!);
await File.WriteAllTextAsync(output, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }), ct);
Console.WriteLine($"SQL smoke evidence written to {output}; errors={errors.Count}");
return errors.IsEmpty && readMs.Count > 0 && updateMs.Count > 0 ? 0 : 1;
