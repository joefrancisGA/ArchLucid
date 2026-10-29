using System.Diagnostics;
using System.Text.Json;
using Microsoft.Data.SqlClient;

// Opt-in Azure SQL test database only. Creates a session-local temporary table, no schema migrations.
if (args.Length != 5 || !int.TryParse(args[2], out int rows) || rows is < 100 or > 10000 ||
    !int.TryParse(args[3], out int iterations) || iterations is < 3 or > 100 ||
    args[4] != "I_APPROVE_TEST_BENCHMARK")
{
    Console.Error.WriteLine("Usage: <ARM database resource id> <database name> <rows 100..10000> <iterations 3..100> I_APPROVE_TEST_BENCHMARK");
    return 2;
}
string resource = args[0], database = args[1];
string? connectionString = Environment.GetEnvironmentVariable("ARCHLUCID_AZURE_SQL_TEST_CONNECTION");
if (!System.Text.RegularExpressions.Regex.IsMatch(resource,
        @"^/subscriptions/[a-fA-F0-9-]{36}/resourceGroups/[^/]+/providers/Microsoft\.Sql/servers/[^/]+/databases/[^/]+$",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase) ||
    !database.StartsWith("ArchLucidCapacityTest_", StringComparison.Ordinal) ||
    !resource.EndsWith("/databases/" + database, StringComparison.OrdinalIgnoreCase) ||
    string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Dedicated Azure SQL database identity and environment connection are required.");

SqlConnectionStringBuilder builder = new(connectionString);
if ((builder.Encrypt.ToString() != "Mandatory" && builder.Encrypt.ToString() != "Strict" && builder.Encrypt.ToString() != "True") || builder.TrustServerCertificate ||
    !string.Equals(builder.InitialCatalog, database, StringComparison.OrdinalIgnoreCase) ||
    !builder.DataSource.EndsWith(".database.windows.net", StringComparison.OrdinalIgnoreCase))
    throw new InvalidOperationException("Azure SQL TLS and catalog validation failed.");
builder.ConnectTimeout = Math.Min(builder.ConnectTimeout, 15);
await using SqlConnection sql = new(builder.ConnectionString);
await sql.OpenAsync();
await using (SqlCommand identity = sql.CreateCommand())
{
    identity.CommandText = "SELECT DB_NAME(), CONVERT(nvarchar(128), SERVERPROPERTY('ServerName'))";
    await using var reader = await identity.ExecuteReaderAsync();
    if (!await reader.ReadAsync() || !string.Equals(reader.GetString(0), database, StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Connected database identity mismatch.");
}
await using (SqlCommand setup = sql.CreateCommand())
{
    setup.CommandTimeout = 30;
    setup.CommandText = """
        CREATE TABLE #ArchLucidCapacityRead (Id int NOT NULL PRIMARY KEY, Payload nvarchar(64) NOT NULL);
        WITH nums AS (SELECT TOP (@rows) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS i
                      FROM sys.all_objects a CROSS JOIN sys.all_objects b)
        INSERT INTO #ArchLucidCapacityRead (Id, Payload) SELECT i, N'capacity-fixture' FROM nums;
        """;
    setup.Parameters.AddWithValue("@rows", rows);
    await setup.ExecuteNonQueryAsync();
}
await using SqlCommand query = sql.CreateCommand();
query.CommandText = "SELECT TOP (10) Id FROM #ArchLucidCapacityRead WHERE Id >= @id ORDER BY Id";
var id = query.Parameters.Add("@id", System.Data.SqlDbType.Int);
async Task Execute(int value)
{
    id.Value = value;
    await using SqlDataReader reader = await query.ExecuteReaderAsync();
    int count = 0;
    while (await reader.ReadAsync()) count++;
    if (count == 0) throw new InvalidOperationException("No benchmark data returned.");
}
await Execute(0);
List<double> latencies = new(iterations);
TimeProvider clock = TimeProvider.System;
DateTimeOffset start = clock.GetUtcNow();
Stopwatch elapsed = Stopwatch.StartNew();
for (int i = 0; i < iterations; i++)
{
    long tick = Stopwatch.GetTimestamp();
    await Execute(i * rows / (iterations + 1));
    latencies.Add(Stopwatch.GetElapsedTime(tick).TotalMilliseconds);
}
elapsed.Stop();
DateTimeOffset end = clock.GetUtcNow();
latencies.Sort();
var result = new
{
    schemaVersion = 1, backend = "AZURE_SQL_TEMP_TABLE_TEST_ONLY",
    azureSqlResourceId = resource, database, rows, iterations,
    measurementStartUtc = start, measurementEndUtc = end,
    p50Milliseconds = latencies[(latencies.Count - 1) / 2],
    p95Milliseconds = latencies[(int)Math.Ceiling(latencies.Count * 0.95) - 1],
    elapsedSeconds = elapsed.Elapsed.TotalSeconds,
    evidenceStatus = "AZURE_SQL_BOUNDED_READ_NOT_PRODUCT_REPOSITORY",
    limitations = "Single connection, session temporary table; no server CPU attribution or production load representation."
};
string? output = Environment.GetEnvironmentVariable("ARCHLUCID_AZURE_SQL_BENCH_OUTPUT");
if (string.IsNullOrWhiteSpace(output)) throw new InvalidOperationException("Explicit output path required");
string destination = Path.GetFullPath(output);
Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
await File.WriteAllTextAsync(destination, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
Console.WriteLine("Benchmark completed; no credentials written.");
return 0;
