using System.Diagnostics;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "CapacityBenchmark")]
public sealed class SqlCapacityBenchmarkTests(SqlServerPersistenceFixture fixture)
{
    [SkippableTheory]
    [InlineData(500, 1)]
    [InlineData(2000, 4)]
    public async Task Scoped_indexed_sql_reads(int rows, int concurrency)
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        const int iterationsPerWorker = 15;
        long[] samples = new long[concurrency * iterationsPerWorker];
        Stopwatch overall = Stopwatch.StartNew();
        await Task.WhenAll(Enumerable.Range(0, concurrency).Select(async worker =>
        {
            await using SqlConnection connection = new(fixture.ConnectionString);
            await connection.OpenAsync();
            await using (SqlCommand setup = connection.CreateCommand())
            {
                setup.CommandText = """
                    CREATE TABLE #CapacityRows (TenantId uniqueidentifier NOT NULL,
                      Sequence int NOT NULL, Payload nvarchar(80) NOT NULL);
                    CREATE INDEX IX_CapacityRows_Scope ON #CapacityRows(TenantId, Sequence);
                    DECLARE @i int = 0;
                    WHILE @i < @rows BEGIN
                      INSERT INTO #CapacityRows VALUES (@tenant, @i, N'fixture');
                      SET @i += 1;
                    END
                    """;
                setup.Parameters.AddWithValue("@rows", rows);
                setup.Parameters.AddWithValue("@tenant", Guid.Parse("11111111-1111-1111-1111-111111111111"));
                await setup.ExecuteNonQueryAsync();
            }
            await using SqlCommand query = connection.CreateCommand();
            query.CommandText = "SELECT TOP (10) Sequence FROM #CapacityRows WHERE TenantId=@tenant AND Sequence>=@start ORDER BY Sequence";
            query.Parameters.AddWithValue("@tenant", Guid.Parse("11111111-1111-1111-1111-111111111111"));
            SqlParameter start = query.Parameters.Add("@start", System.Data.SqlDbType.Int);
            for (int i = -1; i < iterationsPerWorker; i++)
            {
                start.Value = Math.Max(0, i * rows / iterationsPerWorker);
                long began = Stopwatch.GetTimestamp();
                await using SqlDataReader reader = await query.ExecuteReaderAsync();
                int count = 0;
                while (await reader.ReadAsync()) count++;
                long elapsed = Stopwatch.GetTimestamp() - began;
                if (count == 0) throw new InvalidOperationException("Expected indexed rows");
                if (i >= 0) samples[worker * iterationsPerWorker + i] = elapsed;
            }
        }));
        overall.Stop();
        string? root = Environment.GetEnvironmentVariable("ARCHLUCID_CAPACITY_BENCH_OUTPUT");
        if (string.IsNullOrWhiteSpace(root)) return;
        Directory.CreateDirectory(root);
        double[] sorted = samples.Select(t => t * 1000d / Stopwatch.Frequency).Order().ToArray();
        var report = new { schemaVersion = 1, backend = "SQL_SERVER_TEMP_TABLE_FIXTURE",
            rows, concurrency, queries = samples.Length, elapsedSeconds = overall.Elapsed.TotalSeconds,
            p50Milliseconds = sorted[sorted.Length / 2],
            p95Milliseconds = sorted[Math.Max(0, (int)Math.Ceiling(sorted.Length * .95) - 1)],
            limitations = "Scoped indexed SQL temp-table reads, not product persistence repository or production data; timings include test host scheduling." };
        await File.WriteAllTextAsync(Path.Combine(root, $"sql-{rows}-{concurrency}.json"),
            JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
    }
}
