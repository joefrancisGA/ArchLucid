using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
/// <see cref="RetrievalIndexingService"/> embedding batching and chunk caps.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalIndexingServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private static RetrievalIndexingService CreateSut(
        IEmbeddingService embeddings,
        IEmbeddingModelIdentity identity,
        IVectorIndex index,
        IRetrievalDocumentIndexCatalog catalog,
        IOptionsMonitor<RetrievalEmbeddingCapOptions> caps,
        IScopeContextProvider? scopeContextProvider = null,
        RetrievalChunkingStrategy chunkingStrategy = RetrievalChunkingStrategy.Simple)
    {
        IScopeContextProvider scope = scopeContextProvider ?? CreateMatchingScopeProvider();

        Mock<IOptionsMonitor<RetrievalChunkingOptions>> chunking = new();
        chunking.Setup(m => m.CurrentValue).Returns(new RetrievalChunkingOptions { Strategy = chunkingStrategy });

        return new RetrievalIndexingService(
            new SimpleTextChunker(),
            new StructureAwareTextChunker(),
            new PolicyPackChunker(),
            new PriorManifestChunker(),
            embeddings,
            identity,
            index,
            catalog,
            caps,
            chunking.Object,
            scope);
    }

    private static IScopeContextProvider CreateMatchingScopeProvider()
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        });

        return scope.Object;
    }

    [Fact]
    public async Task IndexDocumentsAsync_rejects_cross_tenant_document_metadata()
    {
        Mock<IEmbeddingService> embeddings = new();

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            new InMemoryVectorIndex(),
            new InMemoryRetrievalDocumentIndexCatalog(),
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "cross-tenant",
            TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "wrong tenant",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Func<Task> act = async () => await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*TenantId*");
    }

    [Fact]
    public async Task IndexDocumentsAsync_SplitsEmbedManyIntoBatchesPerCap()
    {
        List<int> batchSizes = [];
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<string>, CancellationToken>((texts, _) => batchSizes.Add(texts.Count))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 2, MaxChunksPerIndexOperation = 0 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        string longContent = new('x', 5200);
        RetrievalDocument doc = new()
        {
            DocumentId = "d1",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = longContent,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        batchSizes.Should().Equal(2, 2, 1);
    }

    [Fact]
    public async Task IndexDocumentsAsync_WhenTotalChunksExceedsCap_Throws()
    {
        Mock<IEmbeddingService> embeddings = new();

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16, MaxChunksPerIndexOperation = 3 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(32);

        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            new InMemoryVectorIndex(),
            new InMemoryRetrievalDocumentIndexCatalog(),
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "d1",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new('y', 4200),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Func<Task> act = async () => await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*MaxChunksPerIndexOperation*");
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_chunk_cap_exceeded_after_prior_index_does_not_leave_vectors_deleted()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16, MaxChunksPerIndexOperation = 0 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        const string documentId = "d-cap-rollback";
        RetrievalDocument smallDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "small stable corpus",
            ContentHash = "HASH-STABLE",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([smallDoc], CancellationToken.None);
        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(0);

        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16, MaxChunksPerIndexOperation = 2 });

        RetrievalDocument largeDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('x', 5200),
            ContentHash = "HASH-LARGE",
            CreatedUtc = smallDoc.CreatedUtc,
        };

        Func<Task> overCapAttempt = async () => await sut.IndexDocumentsAsync([largeDoc], CancellationToken.None);
        await overCapAttempt.Should().ThrowAsync<InvalidOperationException>();

        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(0);

        await sut.IndexDocumentsAsync([smallDoc], CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task IndexDocumentsAsync_SkipsEmbeddingWhenContentHashAndFingerprintUnchanged()
    {
        int embedCalls = 0;
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback(() => embedCalls++)
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "d-skip",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "stable corpus text for skip test",
            ContentHash = "HASH-STABLE",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);
        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        embedCalls.Should().Be(1);
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_upsert_fails_still_reindexes_on_retry_with_same_content_hash()
    {
        int embedCalls = 0;
        int upsertCalls = 0;
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback(() => embedCalls++)
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IVectorIndex> index = new();
        index
            .Setup(i => i.UpsertChunksAsync(It.IsAny<IReadOnlyList<RetrievalChunk>>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                upsertCalls++;

                if (upsertCalls == 1)
                    throw new InvalidOperationException("simulated vector upsert failure");

                return Task.CompletedTask;
            });

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index.Object,
            catalog,
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "d-upsert-fail",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "corpus text that must reach the vector index",
            ContentHash = "HASH-UPSERT-FAIL",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Func<Task> firstAttempt = async () => await sut.IndexDocumentsAsync([doc], CancellationToken.None);
        await firstAttempt.Should().ThrowAsync<InvalidOperationException>();

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        embedCalls.Should().Be(2);
        upsertCalls.Should().Be(2);
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_content_chunks_to_empty_removes_stale_vectors_and_updates_catalog()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        const string documentId = "d-empty-reindex";
        RetrievalDocument indexedDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "corpus text that produces retrievable chunks",
            ContentHash = "HASH1",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([indexedDoc], CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(0);
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? priorState).Should().BeTrue();
        priorState!.ContentHash.Should().Be("HASH1");

        RetrievalDocument emptiedDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "   ",
            ContentHash = "HASH2",
            CreatedUtc = indexedDoc.CreatedUtc,
        };

        await sut.IndexDocumentsAsync([emptiedDoc], CancellationToken.None);

        index.GetEmbeddingMetadata().Should().BeNull("whitespace-only reindex must remove prior vectors");
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? updatedState).Should().BeTrue();
        updatedState!.ContentHash.Should().Be("HASH2");
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_content_shrinks_removes_stale_higher_ordinal_chunks()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        const string documentId = "d-shrink-reindex";
        RetrievalDocument longDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('x', 5200),
            ContentHash = "HASH-LONG",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([longDoc], CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(1);

        RetrievalDocument shortDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('y', 100),
            ContentHash = "HASH-SHORT",
            CreatedUtc = longDoc.CreatedUtc,
        };

        await sut.IndexDocumentsAsync([shortDoc], CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().Be(1);
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? state).Should().BeTrue();
        state!.ContentHash.Should().Be("HASH-SHORT");
    }

    [Fact]
    public void ChunkingStrategyFingerprint_differs_when_semantic_strategy_enabled()
    {
        string simple = ChunkingStrategyFingerprint.Compute(CorpusKind.Conversation, RetrievalChunkingStrategy.Simple);
        string semantic = ChunkingStrategyFingerprint.Compute(CorpusKind.Conversation, RetrievalChunkingStrategy.Semantic);

        semantic.Should().NotBe(simple);
    }

    [Fact]
    public async Task IndexDocumentsAsync_uses_semantic_chunker_when_strategy_enabled()
    {
        List<string> embeddedTexts = [];
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<string>, CancellationToken>((texts, _) => embeddedTexts.AddRange(texts))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            new InMemoryVectorIndex(),
            new InMemoryRetrievalDocumentIndexCatalog(),
            caps.Object,
            chunkingStrategy: RetrievalChunkingStrategy.Semantic);

        string sectionA = new string('a', 700);
        string sectionB = new string('b', 700);
        string content = $"## Section A\n{sectionA}\n\n## Section B\n{sectionB}";

        RetrievalDocument doc = new()
        {
            DocumentId = "semantic-doc",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = content,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        embeddedTexts.Should().HaveCountGreaterThan(1);
        embeddedTexts[0].Should().Contain("## Section A");
        embeddedTexts.Should().Contain(chunk => chunk.Contains("## Section B"));
    }

    [Fact]
    public void ChunkingStrategyFingerprint_differs_by_corpus_kind()
    {
        string conversation = ChunkingStrategyFingerprint.Compute(CorpusKind.Conversation);
        string policyPack = ChunkingStrategyFingerprint.Compute(CorpusKind.PolicyPack);

        conversation.Should().NotBe(policyPack);
    }

    [Fact]
    public async Task IndexDocumentsAsync_reindexes_when_chunking_fingerprint_changes()
    {
        int embedCalls = 0;
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback(() => embedCalls++)
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "d-fingerprint",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "corpus for fingerprint invalidation",
            ContentHash = "HASH-FP",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        RetrievalDocument policyDoc = new()
        {
            DocumentId = doc.DocumentId,
            TenantId = doc.TenantId,
            WorkspaceId = doc.WorkspaceId,
            ProjectId = doc.ProjectId,
            CorpusKind = CorpusKind.PolicyPack,
            Content = doc.Content,
            ContentHash = doc.ContentHash,
            CreatedUtc = doc.CreatedUtc,
        };

        await sut.IndexDocumentsAsync([policyDoc], CancellationToken.None);

        embedCalls.Should().Be(2);
    }

    [Fact]
    public async Task IndexDocumentsAsync_records_corpus_freshness_summaries()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            new InMemoryVectorIndex(),
            catalog,
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "freshness-doc",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.PolicyPack,
            Content = "policy pack freshness probe",
            ContentHash = "HASH-FRESH",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        IReadOnlyList<RetrievalCorpusFreshnessSummary> summaries = catalog.GetCorpusFreshnessSummaries();

        summaries.Should().ContainSingle();
        summaries[0].CorpusKind.Should().Be(nameof(CorpusKind.PolicyPack));
        summaries[0].DocumentCount.Should().Be(1);
        summaries[0].LastIndexedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task IndexDocumentsAsync_records_chunk_count_in_corpus_freshness_summary()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        InMemoryVectorIndex index = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "multi-chunk-doc",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('x', 5200),
            ContentHash = "HASH-MULTI",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        IReadOnlyList<RetrievalCorpusFreshnessSummary> summaries = catalog.GetCorpusFreshnessSummaries();

        summaries.Should().ContainSingle();
        summaries[0].DocumentCount.Should().Be(1);
        summaries[0].ChunkCount.Should().BeGreaterThan(1);
        summaries[0].ChunkCount.Should().Be(index.GetEmbeddingMetadata()!.ChunkCount);
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_later_document_embed_fails_does_not_leave_earlier_document_vectors_deleted()
    {
        const string firstDocumentId = "d-multi-first";
        const string secondDocumentId = "d-multi-second";

        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
            {
                if (texts.Any(t => t.Contains("trigger embed failure", StringComparison.Ordinal)))
                    throw new InvalidOperationException("simulated embedding failure on second document");

                return texts.Select(_ => new float[4]).ToList();
            });

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object);

        RetrievalDocument firstIndexedAlone = new()
        {
            DocumentId = firstDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "first document stable corpus",
            ContentHash = "HASH-FIRST-V1",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([firstIndexedAlone], CancellationToken.None);
        int chunkCountBeforeBatch = index.GetEmbeddingMetadata()!.ChunkCount;
        chunkCountBeforeBatch.Should().BeGreaterThan(0);

        RetrievalDocument firstInBatch = new()
        {
            DocumentId = firstDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "first document updated corpus in same batch",
            ContentHash = "HASH-FIRST-V2",
            CreatedUtc = firstIndexedAlone.CreatedUtc,
        };

        RetrievalDocument secondInBatch = new()
        {
            DocumentId = secondDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "trigger embed failure on second document",
            ContentHash = "HASH-SECOND",
            CreatedUtc = firstIndexedAlone.CreatedUtc,
        };

        Func<Task> batchAttempt = async () =>
            await sut.IndexDocumentsAsync([firstInBatch, secondInBatch], CancellationToken.None);

        await batchAttempt.Should().ThrowAsync<InvalidOperationException>();

        index.GetEmbeddingMetadata()!.ChunkCount.Should().Be(
            chunkCountBeforeBatch,
            "embedding failure on a later document in the same batch must not delete earlier document vectors before upsert");

        catalog.TryGet(firstDocumentId, out RetrievalDocumentIndexState? firstState).Should().BeTrue();
        firstState!.ContentHash.Should().Be("HASH-FIRST-V1");
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_batch_upsert_fails_does_not_leave_prior_document_vectors_deleted()
    {
        const string firstDocumentId = "d-upsert-batch-first";
        const string secondDocumentId = "d-upsert-batch-second";

        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        InMemoryVectorIndex innerIndex = new();
        int upsertCalls = 0;
        Mock<IVectorIndex> index = new();
        index
            .Setup(i => i.UpsertChunksAsync(It.IsAny<IReadOnlyList<RetrievalChunk>>(), It.IsAny<CancellationToken>()))
            .Returns<IReadOnlyList<RetrievalChunk>, CancellationToken>(async (batch, token) =>
            {
                upsertCalls++;

                if (upsertCalls == 2)
                    throw new InvalidOperationException("simulated batch vector upsert failure");

                await innerIndex.UpsertChunksAsync(batch, token);
            });
        index
            .Setup(i => i.RemoveChunksForDocumentAsync(
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns<string, Guid, Guid, Guid, CancellationToken>((documentId, tenantId, workspaceId, projectId, token) =>
                innerIndex.RemoveChunksForDocumentAsync(documentId, tenantId, workspaceId, projectId, token));
        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index.Object,
            catalog,
            caps.Object);

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
        RetrievalDocument firstDoc = new()
        {
            DocumentId = firstDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "first document stable corpus for upsert batch failure",
            ContentHash = "HASH-FIRST-V1",
            CreatedUtc = createdUtc,
        };

        RetrievalDocument secondDoc = new()
        {
            DocumentId = secondDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "second document stable corpus for upsert batch failure",
            ContentHash = "HASH-SECOND-V1",
            CreatedUtc = createdUtc,
        };

        await sut.IndexDocumentsAsync([firstDoc, secondDoc], CancellationToken.None);
        int chunkCountBeforeBatch = innerIndex.GetEmbeddingMetadata()!.ChunkCount;
        chunkCountBeforeBatch.Should().BeGreaterThan(0);

        RetrievalDocument firstUpdate = new()
        {
            DocumentId = firstDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "first document updated in failed batch",
            ContentHash = "HASH-FIRST-V2",
            CreatedUtc = createdUtc,
        };

        RetrievalDocument secondUpdate = new()
        {
            DocumentId = secondDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "second document updated in failed batch",
            ContentHash = "HASH-SECOND-V2",
            CreatedUtc = createdUtc,
        };

        Func<Task> batchAttempt = async () =>
            await sut.IndexDocumentsAsync([firstUpdate, secondUpdate], CancellationToken.None);

        await batchAttempt.Should().ThrowAsync<InvalidOperationException>();

        innerIndex.GetEmbeddingMetadata()!.ChunkCount.Should().Be(chunkCountBeforeBatch);

        catalog.TryGet(firstDocumentId, out RetrievalDocumentIndexState? firstState).Should().BeTrue();
        firstState!.ContentHash.Should().Be("HASH-FIRST-V1");
        catalog.TryGet(secondDocumentId, out RetrievalDocumentIndexState? secondState).Should().BeTrue();
        secondState!.ContentHash.Should().Be("HASH-SECOND-V1");
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_content_shrinks_keeps_new_chunks_when_stale_ordinal_cleanup_reupsert_would_fail()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        InMemoryVectorIndex innerIndex = new();
        int upsertCalls = 0;
        Mock<IVectorIndex> index = new();
        index
            .Setup(i => i.UpsertChunksAsync(It.IsAny<IReadOnlyList<RetrievalChunk>>(), It.IsAny<CancellationToken>()))
            .Returns<IReadOnlyList<RetrievalChunk>, CancellationToken>(async (batch, token) =>
            {
                upsertCalls++;

                if (upsertCalls == 3)
                    throw new InvalidOperationException("simulated shrink re-upsert failure");

                await innerIndex.UpsertChunksAsync(batch, token);
            });
        index
            .Setup(i => i.RemoveChunksForDocumentAsync(
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns<string, Guid, Guid, Guid, CancellationToken>((documentId, tenantId, workspaceId, projectId, token) =>
                innerIndex.RemoveChunksForDocumentAsync(documentId, tenantId, workspaceId, projectId, token));
        index
            .Setup(i => i.RemoveChunkIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Returns<IReadOnlyList<string>, CancellationToken>((chunkIds, token) =>
                innerIndex.RemoveChunkIdsAsync(chunkIds, token));

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryRetrievalDocumentIndexCatalog catalog = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index.Object,
            catalog,
            caps.Object);

        const string documentId = "d-shrink-reupsert-fail";
        RetrievalDocument longDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('x', 5200),
            ContentHash = "HASH-LONG",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([longDoc], CancellationToken.None);
        innerIndex.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(1);

        RetrievalDocument shortDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('y', 100),
            ContentHash = "HASH-SHORT",
            CreatedUtc = longDoc.CreatedUtc,
        };

        Func<Task> shrinkAttempt = async () => await sut.IndexDocumentsAsync([shortDoc], CancellationToken.None);
        await shrinkAttempt.Should().NotThrowAsync();

        innerIndex.GetEmbeddingMetadata()!.ChunkCount.Should().Be(1);
        upsertCalls.Should().Be(2, "shrink reindex must not require a second upsert after deleting the whole document");
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? state).Should().BeTrue();
        state!.ContentHash.Should().Be("HASH-SHORT");
    }
}
