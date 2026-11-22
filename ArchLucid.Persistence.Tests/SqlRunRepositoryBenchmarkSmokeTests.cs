using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

/// <summary>
/// Opt-in measured repository smoke benchmark using the existing isolated, migrated SQL integration fixture.
/// This is not a latency gate. Do not enable against a shared or production database.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Benchmark")]
public sealed class SqlRunRepositoryBenchmarkSmokeTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Measure_scoped_repository_reads_after_deterministic_seed()
    {
        Skip.IfNot(
            Environment.GetEnvironmentVariable("ARCHLUCID_ENABLE_SQL_REPOSITORY_BENCH") == "I_APPROVE_ISOLATED_BENCHMARK",
            "Repository benchmark requires explicit opt-in.");
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        const int rows = 1000;
        const int workers = 4;
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"),
            WorkspaceId = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2"),
            ProjectId = Guid.Parse("a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3"),
        };
        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlRunRepository repository = SqlRunRepositoryTestFactory.Create(
            factory, new TestAuthorityRunListConnectionFactory(factory));
        Guid[] ids = new Guid[rows];
        Guid batch = Guid.NewGuid();

        using CancellationTokenSource timeout = new(TimeSpan.FromMinutes(10));
        CancellationToken ct = timeout.Token;
        // Seeding is excluded from measured latency; the fixture owns the isolated catalog.
        for (int i = 0; i < rows; i++)
        {
            Guid id = Guid.NewGuid();
            ids[i] = id;
            await repository.SaveAsync(new RunRecord
            {
                RunId = id,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "repository-benchmark",
                Description = $"bench-{batch:N}-{i:D4}",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            }, ct);
        }

        ConcurrentBag<double> samples = [];
        Stopwatch elapsed = Stopwatch.StartNew();
        await Task.WhenAll(Enumerable.Range(0, workers).Select(async worker =>
        {
            for (int i = worker; i < rows; i += workers)
            {
                Stopwatch sw = Stopwatch.StartNew();
                RunRecord? result = await repository.GetByIdAsync(scope, ids[i], ct);
                sw.Stop();
                result.Should().NotBeNull();
                samples.Add(sw.Elapsed.TotalMilliseconds);
            }
        }));
        elapsed.Stop();

        double[] ordered = samples.Order().ToArray();
        double Percentile(double p) => ordered[Math.Min(ordered.Length - 1, (int)Math.Ceiling(p * ordered.Length) - 1)];
        string output = Environment.GetEnvironmentVariable("ARCHLUCID_SQL_REPOSITORY_BENCH_OUTPUT")
            ?? Path.Combine(Path.GetTempPath(), $"archlucid-sql-repository-bench-{batch:N}.json");
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(output))!);
        await File.WriteAllTextAsync(output, JsonSerializer.Serialize(new
        {
            schemaVersion = 1,
            workload = "SqlRunRepository.GetByIdAsync",
            profile = "smoke",
            rows, workers,
            measuredOperations = ordered.Length,
            elapsedMs = elapsed.Elapsed.TotalMilliseconds,
            p50Ms = Percentile(.50),
            p95Ms = Percentile(.95),
            p99Ms = Percentile(.99),
            batch,
            commit = Environment.GetEnvironmentVariable("GITHUB_SHA") ?? "unknown",
            generatedUtc = DateTimeOffset.UtcNow,
            environment = "SQL integration fixture (isolated, migrated)",
            caveat = "One measured read per seeded run; setup excluded; not production capacity."
        }, new JsonSerializerOptions { WriteIndented = true }), ct);
        Console.WriteLine($"Repository SQL benchmark evidence: {output}");
        ordered.Should().HaveCount(rows);
    }
}
