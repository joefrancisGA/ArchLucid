using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.Evaluation;

/// <summary>
///     C# in-process mirror of <c>scripts/ci/eval_retrieval_ir.py</c> (RAG-V1-011).
///     Validates recall@k and MRR against the golden dataset, and asserts tenant-scoped
///     retrieval filters return no results for a mismatched tenant.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalIrEvalTests
{
    private static readonly Guid TestTenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TestWorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid TestProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private const string TestPolicyPackRulePackId = "eval-golden-pack";

    [SkippableFact]
    public async Task GoldenDataset_MeetsRecallAndMrrFloors()
    {
        RetrievalIrGoldenDataset dataset = LoadGoldenDataset();
        InMemoryVectorIndex index = BuildIndex(dataset);

        double totalRecall = 0.0;
        double totalMrr = 0.0;
        int caseCount = 0;

        foreach (RetrievalIrCase testCase in dataset.Cases)
        {
            RetrievalQuery query = BuildQuery(testCase);
            IReadOnlyList<RetrievalHit> hits = await index.SearchAsync(query, testCase.QueryEmbedding, CancellationToken.None);

            IReadOnlyList<string> returnedIds = hits.Select(h => h.ChunkId).ToList();
            totalRecall += RecallAtK(returnedIds, testCase.ExpectedChunkIds, testCase.TopK);
            totalMrr += Mrr(returnedIds, testCase.ExpectedChunkIds);
            caseCount++;
        }

        Skip.If(caseCount == 0, "No IR eval cases found in golden dataset.");

        double meanRecall = totalRecall / caseCount;
        double meanMrr = totalMrr / caseCount;

        meanRecall.Should().BeGreaterOrEqualTo(
            dataset.MinRecallAt5,
            because: $"mean recall@k {meanRecall:F4} must meet floor {dataset.MinRecallAt5} across {caseCount} cases");

        meanMrr.Should().BeGreaterOrEqualTo(
            dataset.MinMrr,
            because: $"mean MRR {meanMrr:F4} must meet floor {dataset.MinMrr} across {caseCount} cases");
    }

    [Fact]
    public async Task TenantIsolation_WrongTenantQuery_ReturnsEmpty()
    {
        RetrievalIrGoldenDataset dataset = LoadGoldenDataset();
        InMemoryVectorIndex index = BuildIndex(dataset);

        RetrievalIrCase firstCase = dataset.Cases.First();

        RetrievalQuery wrongTenantQuery = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = TestWorkspaceId,
            ProjectId = TestProjectId,
            TopK = firstCase.TopK,
            IncludePlatformCorpora = true,
            AllowedPolicyPackRulePackIds = new HashSet<string> { TestPolicyPackRulePackId },
            QueryText = "tenant isolation check"
        };

        IReadOnlyList<RetrievalHit> hits = await index.SearchAsync(
            wrongTenantQuery,
            firstCase.QueryEmbedding,
            CancellationToken.None);

        hits.Should().BeEmpty(because: "a query with a mismatched tenant must return no results");
    }

    [Fact]
    public async Task GoldenCorpus_AllChunks_AreIndexedAndSearchable()
    {
        RetrievalIrGoldenDataset dataset = LoadGoldenDataset();
        InMemoryVectorIndex index = BuildIndex(dataset);

        // Identity query: use the embedding of the first corpus chunk as the query vector.
        // The first chunk itself should be returned as the top hit.
        RetrievalIrCorpusChunk firstChunk = dataset.Corpus.First();

        RetrievalQuery query = new()
        {
            TenantId = TestTenantId,
            WorkspaceId = TestWorkspaceId,
            ProjectId = TestProjectId,
            TopK = 1,
            IncludePlatformCorpora = true,
            AllowedPolicyPackRulePackIds = new HashSet<string> { TestPolicyPackRulePackId },
            QueryText = "identity search"
        };

        IReadOnlyList<RetrievalHit> hits = await index.SearchAsync(
            query,
            firstChunk.Embedding,
            CancellationToken.None);

        hits.Should().NotBeEmpty(because: "the identity query must return the indexed chunk");
        hits[0].ChunkId.Should().Be(firstChunk.ChunkId);
    }

    private static InMemoryVectorIndex BuildIndex(RetrievalIrGoldenDataset dataset)
    {
        InMemoryVectorIndex index = new();

        IReadOnlyList<RetrievalChunk> chunks = dataset.Corpus
            .Select(ToRetrievalChunk)
            .ToList();

        index.UpsertChunksAsync(chunks, CancellationToken.None).GetAwaiter().GetResult();

        return index;
    }

    private static RetrievalChunk ToRetrievalChunk(RetrievalIrCorpusChunk src) =>
        new()
        {
            ChunkId = src.ChunkId,
            DocumentId = src.ChunkId,
            TenantId = TestTenantId,
            WorkspaceId = TestWorkspaceId,
            ProjectId = TestProjectId,
            CorpusKind = ParseCorpusKind(src.CorpusKind),
            SourceType = "eval-golden",
            SourceId = src.ChunkId,
            Title = src.Title ?? src.ChunkId,
            Text = src.Text ?? string.Empty,
            Embedding = src.Embedding,
            EmbeddingDimension = src.Embedding.Length,
            PolicyPackRulePackId = TestPolicyPackRulePackId
        };

    private static RetrievalQuery BuildQuery(RetrievalIrCase testCase) =>
        new()
        {
            TenantId = TestTenantId,
            WorkspaceId = TestWorkspaceId,
            ProjectId = TestProjectId,
            TopK = testCase.TopK,
            QueryText = "eval-golden",
            IncludePlatformCorpora = true,
            AllowedPolicyPackRulePackIds = new HashSet<string> { TestPolicyPackRulePackId }
        };

    private static CorpusKind ParseCorpusKind(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return CorpusKind.Conversation;

        return Enum.TryParse(raw, ignoreCase: true, out CorpusKind kind) ? kind : CorpusKind.Conversation;
    }

    /// <summary>Recall at topK: fraction of expected IDs found in the top-k returned IDs, capped at 1.</summary>
    private static double RecallAtK(
        IReadOnlyList<string> returnedIds,
        IReadOnlyList<string> expectedIds,
        int topK)
    {
        if (expectedIds.Count == 0)
            return 1.0;

        HashSet<string> topKSet = returnedIds.Take(topK).ToHashSet(StringComparer.Ordinal);
        int hits = expectedIds.Count(id => topKSet.Contains(id));

        return (double)hits / expectedIds.Count;
    }

    /// <summary>Mean Reciprocal Rank: reciprocal of the rank of the first expected ID in returned results.</summary>
    private static double Mrr(IReadOnlyList<string> returnedIds, IReadOnlyList<string> expectedIds)
    {
        if (expectedIds.Count == 0)
            return 1.0;

        HashSet<string> expectedSet = expectedIds.ToHashSet(StringComparer.Ordinal);

        for (int rank = 0; rank < returnedIds.Count; rank++)
        {
            if (expectedSet.Contains(returnedIds[rank]))
                return 1.0 / (rank + 1);
        }

        return 0.0;
    }

    private static RetrievalIrGoldenDataset LoadGoldenDataset()
    {
        string datasetPath = FindGoldenDatasetPath();
        string json = File.ReadAllText(datasetPath);

        RetrievalIrGoldenDataset? dataset = JsonSerializer.Deserialize<RetrievalIrGoldenDataset>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        dataset.Should().NotBeNull("golden dataset must deserialize successfully");

        return dataset!;
    }

    private static string FindGoldenDatasetPath()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
            {
                string path = Path.Combine(
                    dir.FullName,
                    "tests",
                    "eval-datasets",
                    "retrieval-golden",
                    "cases.json");

                File.Exists(path).Should().BeTrue(
                    because: $"retrieval golden dataset must exist at {path}");

                return path;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not resolve tests/eval-datasets/retrieval-golden/cases.json from test output directory.");
    }

    // ---------- local POCOs for JSON deserialization ----------

    private sealed class RetrievalIrGoldenDataset
    {
        [JsonPropertyName("minRecallAt5")]
        public double MinRecallAt5 { get; set; } = 0.85;

        [JsonPropertyName("minMrr")]
        public double MinMrr { get; set; } = 0.75;

        [JsonPropertyName("corpus")]
        public List<RetrievalIrCorpusChunk> Corpus { get; set; } = [];

        [JsonPropertyName("cases")]
        public List<RetrievalIrCase> Cases { get; set; } = [];
    }

    private sealed class RetrievalIrCorpusChunk
    {
        [JsonPropertyName("chunkId")]
        public string ChunkId { get; set; } = string.Empty;

        [JsonPropertyName("corpusKind")]
        public string? CorpusKind { get; set; }

        [JsonPropertyName("embedding")]
        public float[] Embedding { get; set; } = [];

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    private sealed class RetrievalIrCase
    {
        [JsonPropertyName("queryEmbedding")]
        public float[] QueryEmbedding { get; set; } = [];

        [JsonPropertyName("expectedChunkIds")]
        public List<string> ExpectedChunkIds { get; set; } = [];

        [JsonPropertyName("topK")]
        public int TopK { get; set; } = 5;

        [JsonPropertyName("includePlatformCorpora")]
        public bool IncludePlatformCorpora { get; set; }
    }
}
