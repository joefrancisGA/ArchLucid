using System.Diagnostics;
using System.Text.Json;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "CapacityBenchmark")]
public sealed class VectorCapacityBenchmarkTests
{
    [Theory]
    [InlineData(500, 1)]
    [InlineData(2000, 4)]
    public async Task In_memory_vector_search_seeded_latency(int count, int concurrency)
    {
        Guid tenant = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspace = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid project = Guid.Parse("33333333-3333-3333-3333-333333333333");
        InMemoryVectorIndex index = new();
        var chunks = Enumerable.Range(0, count).Select(i => new RetrievalChunk
        {
            ChunkId = $"fixture-{i}", DocumentId = $"doc-{i}", TenantId = tenant,
            WorkspaceId = workspace, ProjectId = project,
            SourceType = "Benchmark", SourceId = i.ToString(), Title = "Fixture", Text = "Sanitized benchmark text",
            Embedding = [(float)(i % 7 + 1), (float)(i % 11 + 1), 1f],
            EmbeddingModelId = "capacity-fixture", EmbeddingDimension = 3
        }).ToArray();
        await index.UpsertChunksAsync(chunks, CancellationToken.None);
        RetrievalQuery query = new() { TenantId = tenant, WorkspaceId = workspace,
            ProjectId = project, QueryText = "fixture", TopK = 8 };
        float[] vector = [1f, 1f, 1f];
        const int iterationsPerWorker = 15;
        await index.SearchAsync(query, vector, CancellationToken.None); // Warmup excluded
        long[] samples = new long[concurrency * iterationsPerWorker];
        Stopwatch total = Stopwatch.StartNew();
        await Task.WhenAll(Enumerable.Range(0, concurrency).Select(async worker =>
        {
            for (int i = 0; i < iterationsPerWorker; i++)
            {
                long start = Stopwatch.GetTimestamp();
                var hits = await index.SearchAsync(query, vector, CancellationToken.None);
                if (hits.Count != 8) throw new InvalidOperationException("Unexpected result cardinality");
                samples[worker * iterationsPerWorker + i] = Stopwatch.GetTimestamp() - start;
            }
        }));
        total.Stop();
        string? root = Environment.GetEnvironmentVariable("ARCHLUCID_CAPACITY_BENCH_OUTPUT");
        if (string.IsNullOrWhiteSpace(root)) return;
        Directory.CreateDirectory(root);
        double[] ordered = samples.Select(x => x * 1000d / Stopwatch.Frequency).Order().ToArray();
        int p95 = Math.Max(0, (int)Math.Ceiling(ordered.Length * .95) - 1);
        var report = new { schemaVersion = 1, backend = "IN_MEMORY_VECTOR_NOT_REMOTE",
            count, concurrency, queries = samples.Length, elapsedSeconds = total.Elapsed.TotalSeconds,
            p50Milliseconds = ordered[ordered.Length / 2], p95Milliseconds = ordered[p95],
            limitations = "Test-runner timing, shared process, fixed 3D vectors and sanitized fixture. Not isolated production calibration." };
        await File.WriteAllTextAsync(Path.Combine(root, $"vector-{count}-{concurrency}.json"),
            JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
    }
}
