using ArchLucid.Contracts.Admin;
using ArchLucid.Retrieval.Admin;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC27 package-coverage batch: EA discount normalization, agentic heuristics, embedding identity, RAG health, and
///     disabled fine-tuning orchestration.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RetrievalPackageCoverageBatchRc27Tests
{
    [Fact]
    public void TenantEaDiscountMultiplierNormalizer_clamps_invalid_values_to_one()
    {
        TenantEaDiscountMultiplierNormalizer.Normalize(null).Should().Be(1.0m);
        TenantEaDiscountMultiplierNormalizer.Normalize(0m).Should().Be(1.0m);
        TenantEaDiscountMultiplierNormalizer.Normalize(-0.5m).Should().Be(1.0m);
        TenantEaDiscountMultiplierNormalizer.Normalize(1.01m).Should().Be(1.0m);
        TenantEaDiscountMultiplierNormalizer.Normalize(2m).Should().Be(1.0m);
    }

    [Fact]
    public void TenantEaDiscountMultiplierNormalizer_preserves_valid_fraction()
    {
        decimal normalized = TenantEaDiscountMultiplierNormalizer.Normalize(0.85m);

        normalized.Should().Be(0.85m);
    }

    [Fact]
    public void AgenticRetrievalHeuristics_rewrite_preserves_architecture_queries()
    {
        const string query = "Review architecture topology for payments";

        string rewritten = AgenticRetrievalHeuristics.RewriteQuery(query);

        rewritten.Should().Be(query);
    }

    [Fact]
    public void AgenticRetrievalHeuristics_rewrite_appends_context_when_architecture_absent()
    {
        string rewritten = AgenticRetrievalHeuristics.RewriteQuery("  network segmentation  ");

        rewritten.Should().Be("network segmentation — enterprise architecture review context");
    }

    [Fact]
    public void AgenticRetrievalHeuristics_hyde_document_includes_query()
    {
        const string query = "private endpoint strategy";

        string hyde = AgenticRetrievalHeuristics.GenerateHydeDocument(query);

        hyde.Should().Contain(query);
        hyde.Should().Contain("Hypothetical architecture review finding document");
    }

    [Fact]
    public void ConfiguredEmbeddingModelIdentity_reads_options_monitor_current_value()
    {
        RetrievalEmbeddingModelOptions options = new()
        {
            ModelId = "text-embedding-3-large",
            ExpectedDimension = 3072,
        };
        MockOptionsMonitor<RetrievalEmbeddingModelOptions> monitor = new(options);

        ConfiguredEmbeddingModelIdentity identity = new(monitor);

        identity.ModelId.Should().Be("text-embedding-3-large");
        identity.ExpectedDimension.Should().Be(3072);
    }

    [Fact]
    public void ConfiguredEmbeddingModelIdentity_rejects_null_options_monitor()
    {
        FluentActions
            .Invoking(() => _ = new ConfiguredEmbeddingModelIdentity(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void AdminRagHealthQuery_marks_fresh_stale_and_null_last_indexed()
    {
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        Mock<IRetrievalDocumentIndexCatalog> catalog = new();
        catalog
            .Setup(c => c.GetCorpusFreshnessSummaries())
            .Returns(
            [
                new RetrievalCorpusFreshnessSummary
                {
                    CorpusKind = "fresh",
                    DocumentCount = 10,
                    LastIndexedUtc = now.AddHours(-1),
                },
                new RetrievalCorpusFreshnessSummary
                {
                    CorpusKind = "stale",
                    DocumentCount = 4,
                    LastIndexedUtc = now.AddHours(-25),
                },
                new RetrievalCorpusFreshnessSummary
                {
                    CorpusKind = "never",
                    DocumentCount = 0,
                    LastIndexedUtc = null,
                },
            ]);

        Mock<IEmbeddingModelIdentity> embedding = new();
        embedding.SetupGet(e => e.ModelId).Returns("fake-local");
        embedding.SetupGet(e => e.ExpectedDimension).Returns(32);

        AdminRagHealthQuery sut = new(catalog.Object, embedding.Object);

        AdminRagHealthResponse response = sut.GetRagHealth();

        response.EmbeddingModelId.Should().Be("fake-local");
        response.Corpora.Should().HaveCount(3);

        AdminRagCorpusHealthItem fresh = response.Corpora.Single(c => c.CorpusKind == "fresh");
        fresh.IsStale.Should().BeFalse();
        fresh.ChunkCount.Should().Be(10);
        fresh.EmbeddingDimension.Should().Be(32);

        AdminRagCorpusHealthItem stale = response.Corpora.Single(c => c.CorpusKind == "stale");
        stale.IsStale.Should().BeTrue();

        AdminRagCorpusHealthItem never = response.Corpora.Single(c => c.CorpusKind == "never");
        never.IsStale.Should().BeTrue();
        never.LastIndexedUtc.Should().BeNull();
    }

    [Fact]
    public async Task DisabledFineTuningJobOrchestrator_is_not_configured_and_rejects_submit()
    {
        DisabledFineTuningJobOrchestrator sut = new();

        sut.IsConfigured.Should().BeFalse();

        Func<Task<FineTunedModelRegistryEntry>> act = () => sut.SubmitJobAsync(
            Guid.NewGuid(),
            "{\"messages\":[]}",
            "gpt-4o-mini",
            CancellationToken.None);

        await act.Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("*fine-tuning*disabled*");
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
