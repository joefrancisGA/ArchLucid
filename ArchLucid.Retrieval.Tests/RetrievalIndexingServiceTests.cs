using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Provenance;
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
    public async Task IndexDocumentsAsync_rejects_duplicate_document_id_in_one_batch()
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
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            new InMemoryRetrievalDocumentIndexCatalog(),
            caps.Object);

        RetrievalDocument first = new()
        {
            DocumentId = "dup-doc",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "first body",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        RetrievalDocument second = new()
        {
            DocumentId = "dup-doc",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "second body overwrites first",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Func<Task> act = async () => await sut.IndexDocumentsAsync([first, second], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*duplicate DocumentId*dup-doc*");
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
    public async Task IndexDocumentsAsync_when_empty_reindex_precedes_chunk_cap_failure_does_not_partially_delete_prior_vectors()
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

        RetrievalDocument indexedDoc = new()
        {
            DocumentId = "d-empty-cap-rollback",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "existing corpus",
            ContentHash = "HASH-EXISTING",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([indexedDoc], CancellationToken.None);
        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(0);

        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16, MaxChunksPerIndexOperation = 2 });

        RetrievalDocument emptiedDoc = new()
        {
            DocumentId = indexedDoc.DocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "   ",
            ContentHash = "HASH-EMPTY",
            CreatedUtc = indexedDoc.CreatedUtc,
        };

        RetrievalDocument oversizedDoc = new()
        {
            DocumentId = "d-over-cap-after-empty",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('x', 5200),
            ContentHash = "HASH-OVERSIZED",
            CreatedUtc = indexedDoc.CreatedUtc,
        };

        Func<Task> overCapAttempt = async () =>
            await sut.IndexDocumentsAsync([emptiedDoc, oversizedDoc], CancellationToken.None);

        await overCapAttempt.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*MaxChunksPerIndexOperation*");
        index.GetEmbeddingMetadata()!.ChunkCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task IndexDocumentsAsync_skips_unchanged_hash_document_before_chunk_cap_validation_in_same_batch()
    {
        int embedCalls = 0;
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback(() => embedCalls++)
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16, MaxChunksPerIndexOperation = 2 });

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

        RetrievalDocument indexedDoc = new()
        {
            DocumentId = "d-unchanged-cap-batch",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "stable corpus",
            ContentHash = "HASH-STABLE",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([indexedDoc], CancellationToken.None);
        int chunksAfterFirstIndex = index.GetEmbeddingMetadata()!.ChunkCount;
        chunksAfterFirstIndex.Should().BeGreaterThan(0);
        embedCalls.Should().BeGreaterThan(0);

        RetrievalDocument unchangedDuplicate = new()
        {
            DocumentId = indexedDoc.DocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = indexedDoc.Content,
            ContentHash = indexedDoc.ContentHash,
            CreatedUtc = indexedDoc.CreatedUtc,
        };

        RetrievalDocument oversizedDoc = new()
        {
            DocumentId = "d-over-cap-sibling",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = new string('x', 5200),
            ContentHash = "HASH-OVERSIZED",
            CreatedUtc = indexedDoc.CreatedUtc,
        };

        int embedCallsBeforeBatch = embedCalls;
        Func<Task> overCapAttempt = async () =>
            await sut.IndexDocumentsAsync([unchangedDuplicate, oversizedDoc], CancellationToken.None);

        await overCapAttempt.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*MaxChunksPerIndexOperation*");

        embedCalls.Should().Be(embedCallsBeforeBatch);
        index.GetEmbeddingMetadata()!.ChunkCount.Should().Be(chunksAfterFirstIndex);
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
    public async Task IndexDocumentsAsync_without_content_hash_does_not_skip_unchanged_reindex()
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
            DocumentId = "d-no-hash",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "same body every finalize",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);
        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        embedCalls.Should().Be(2);
    }

    [Fact]
    public async Task IndexDocumentsAsync_skips_reindex_when_content_hash_unchanged_even_if_inline_content_differs()
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
            DocumentId = "d-hash-trust",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "original bytes",
            ContentHash = "HASH-TRUST",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        RetrievalDocument staleHashSameContent = new()
        {
            DocumentId = doc.DocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "different inline bytes without hash update",
            ContentHash = doc.ContentHash,
            CreatedUtc = doc.CreatedUtc,
        };

        await sut.IndexDocumentsAsync([staleHashSameContent], CancellationToken.None);

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
    public async Task IndexDocumentsAsync_when_content_chunks_to_empty_removes_orphan_vectors_without_catalog_entry()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IOptionsMonitor<RetrievalChunkingOptions>> chunking = new();
        chunking.Setup(m => m.CurrentValue).Returns(new RetrievalChunkingOptions { Strategy = RetrievalChunkingStrategy.Simple });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new(CreateMatchingScopeProvider());
        InMemoryRetrievalDocumentIndexCatalog catalog = new();

        const string documentId = "d-orphan-empty";
        await index.UpsertChunksAsync(
            [
                new RetrievalChunk
                {
                    ChunkId = $"{documentId}-chunk-0",
                    DocumentId = documentId,
                    TenantId = TenantId,
                    WorkspaceId = WorkspaceId,
                    ProjectId = ProjectId,
                    SourceType = "Test",
                    SourceId = documentId,
                    Title = "orphan",
                    Text = "stale searchable text",
                    ChunkOrdinal = 0,
                    Embedding = [1f, 0f, 0f, 0f],
                    EmbeddingModelId = "test-model",
                    EmbeddingDimension = 4,
                },
            ],
            CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().Be(1);
        catalog.TryGet(documentId, out _).Should().BeFalse("simulate index/catalog drift");

        RetrievalIndexingService sut = new(
            new SimpleTextChunker(),
            new StructureAwareTextChunker(),
            new PolicyPackChunker(),
            new PriorManifestChunker(),
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object,
            chunking.Object,
            CreateMatchingScopeProvider());

        RetrievalDocument emptiedDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "   ",
            ContentHash = "HASH-EMPTY",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([emptiedDoc], CancellationToken.None);

        index.GetEmbeddingMetadata().Should().BeNull("empty reindex must delete vectors even without a catalog row");
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? state).Should().BeTrue();
        state!.IndexedChunkCount.Should().Be(0);
        state.ContentHash.Should().Be("HASH-EMPTY");
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_content_shrinks_removes_orphan_higher_ordinal_chunks_without_catalog_entry()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IOptionsMonitor<RetrievalChunkingOptions>> chunking = new();
        chunking.Setup(m => m.CurrentValue).Returns(new RetrievalChunkingOptions { Strategy = RetrievalChunkingStrategy.Simple });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new(CreateMatchingScopeProvider());
        InMemoryRetrievalDocumentIndexCatalog catalog = new();

        const string documentId = "d-orphan-shrink";
        await index.UpsertChunksAsync(
            [
                new RetrievalChunk
                {
                    ChunkId = $"{documentId}-chunk-0",
                    DocumentId = documentId,
                    TenantId = TenantId,
                    WorkspaceId = WorkspaceId,
                    ProjectId = ProjectId,
                    SourceType = "Test",
                    SourceId = documentId,
                    Title = "orphan-0",
                    Text = "stale chunk zero",
                    ChunkOrdinal = 0,
                    Embedding = [1f, 0f, 0f, 0f],
                    EmbeddingModelId = "test-model",
                    EmbeddingDimension = 4,
                },
                new RetrievalChunk
                {
                    ChunkId = $"{documentId}-chunk-1",
                    DocumentId = documentId,
                    TenantId = TenantId,
                    WorkspaceId = WorkspaceId,
                    ProjectId = ProjectId,
                    SourceType = "Test",
                    SourceId = documentId,
                    Title = "orphan-1",
                    Text = "stale chunk one must be removed",
                    ChunkOrdinal = 1,
                    Embedding = [0f, 1f, 0f, 0f],
                    EmbeddingModelId = "test-model",
                    EmbeddingDimension = 4,
                },
            ],
            CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().Be(2);
        catalog.TryGet(documentId, out _).Should().BeFalse();

        RetrievalIndexingService sut = new(
            new SimpleTextChunker(),
            new StructureAwareTextChunker(),
            new PolicyPackChunker(),
            new PriorManifestChunker(),
            embeddings.Object,
            identity.Object,
            index,
            catalog,
            caps.Object,
            chunking.Object,
            CreateMatchingScopeProvider());

        RetrievalDocument shrunkDoc = new()
        {
            DocumentId = documentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "short text that fits in one chunk",
            ContentHash = "HASH-SHRINK",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([shrunkDoc], CancellationToken.None);

        index.GetEmbeddingMetadata()!.ChunkCount.Should().Be(1, "higher ordinals must be removed when catalog is missing");
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? state).Should().BeTrue();
        state!.IndexedChunkCount.Should().Be(1);
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_content_shrinks_removes_stale_chunks_when_catalog_understates_chunk_count()
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

        const string documentId = "d-catalog-understate-shrink";
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

        int indexedChunkCount = index.GetEmbeddingMetadata()!.ChunkCount;
        indexedChunkCount.Should().BeGreaterThan(1);
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? priorState).Should().BeTrue();

        catalog.RecordIndexed(
            longDoc,
            priorState!.ChunkingFingerprint,
            priorState.LastIndexedUtc,
            indexedChunkCount: 1);

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
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? updatedState).Should().BeTrue();
        updatedState!.IndexedChunkCount.Should().Be(1);
        updatedState.ContentHash.Should().Be("HASH-SHORT");
    }

    [Fact]
    public async Task IndexDocumentsAsync_when_content_shrinks_removes_stale_chunks_when_catalog_understates_during_shrink_branch()
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

        const string documentId = "d-catalog-understate-shrink-branch";
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

        int liveChunkCount = index.GetEmbeddingMetadata()!.ChunkCount;
        liveChunkCount.Should().BeGreaterThan(3);
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? priorState).Should().BeTrue();

        catalog.RecordIndexed(
            longDoc,
            priorState!.ChunkingFingerprint,
            priorState.LastIndexedUtc,
            indexedChunkCount: 3);

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
    public async Task IndexDocumentsAsync_uses_policy_pack_chunker_when_semantic_strategy_enabled()
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

        string body = string.Join(' ', Enumerable.Repeat("Sentence fragment.", 80));
        string content =
            "[pack v1.0] [High] Encrypt data (Security): " + body + "\n\n## Markdown heading\n" + new string('z', 700);

        RetrievalDocument doc = new()
        {
            DocumentId = "policy-pack-semantic",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.PolicyPack,
            Content = content,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        embeddedTexts.Should().NotBeEmpty();
        embeddedTexts.Should().OnlyContain(chunk => chunk.StartsWith("[pack v1.0]", StringComparison.Ordinal));
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
    public async Task IndexDocumentsAsync_when_mixed_empty_and_nonempty_batch_upsert_fails_does_not_record_catalog_for_either_document()
    {
        const string emptyDocumentId = "d-mixed-empty";
        const string workDocumentId = "d-mixed-work";

        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        InMemoryVectorIndex innerIndex = new();
        Mock<IVectorIndex> index = new();
        index
            .Setup(i => i.UpsertChunksAsync(It.IsAny<IReadOnlyList<RetrievalChunk>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated mixed batch upsert failure"));
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
        RetrievalDocument emptyDoc = new()
        {
            DocumentId = emptyDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "   ",
            ContentHash = "HASH-EMPTY-V2",
            CreatedUtc = createdUtc,
        };

        RetrievalDocument workDoc = new()
        {
            DocumentId = workDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "non-empty corpus for mixed batch upsert failure",
            ContentHash = "HASH-WORK-V2",
            CreatedUtc = createdUtc,
        };

        RetrievalDocument priorWorkDoc = new()
        {
            DocumentId = workDocumentId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            CorpusKind = CorpusKind.Conversation,
            Content = "prior corpus",
            ContentHash = "HASH-WORK-V1",
            CreatedUtc = createdUtc,
        };

        catalog.RecordIndexed(
            priorWorkDoc,
            "fp-v1",
            DateTimeOffset.UtcNow,
            indexedChunkCount: 2);

        Func<Task> act = async () => await sut.IndexDocumentsAsync([emptyDoc, workDoc], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();

        catalog.TryGet(emptyDocumentId, out _).Should().BeFalse();
        catalog.TryGet(workDocumentId, out RetrievalDocumentIndexState? workState).Should().BeTrue();
        workState!.ContentHash.Should().Be("HASH-WORK-V1");
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

    [Fact]
    public async Task IndexDocumentsAsync_when_stale_ordinal_cleanup_throws_does_not_record_catalog_indexed()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        InMemoryVectorIndex innerIndex = new();
        Mock<IVectorIndex> index = new();
        index
            .Setup(i => i.UpsertChunksAsync(It.IsAny<IReadOnlyList<RetrievalChunk>>(), It.IsAny<CancellationToken>()))
            .Returns<IReadOnlyList<RetrievalChunk>, CancellationToken>((batch, token) =>
                innerIndex.UpsertChunksAsync(batch, token));
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
            .ThrowsAsync(new InvalidOperationException("simulated stale ordinal delete failure"));

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

        const string documentId = "d-shrink-ordinal-cleanup-fail";
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
        catalog.TryGet(documentId, out RetrievalDocumentIndexState? priorState).Should().BeTrue();
        int priorIndexedCount = priorState!.IndexedChunkCount;

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

        Func<Task> shrinkAttempt = () => sut.IndexDocumentsAsync([shortDoc], CancellationToken.None);
        await shrinkAttempt.Should().ThrowAsync<InvalidOperationException>();

        catalog.TryGet(documentId, out RetrievalDocumentIndexState? afterState).Should().BeTrue();
        afterState!.ContentHash.Should().Be("HASH-LONG");
        afterState.IndexedChunkCount.Should().Be(priorIndexedCount);
    }

    [Fact]
    public async Task IndexDocumentsAsync_reindexes_provenance_when_graph_changes_for_same_run()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[] { 1f, 0f, 0f, 0f }).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16 });

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("test-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(4);

        InMemoryVectorIndex index = new();
        RetrievalIndexingService sut = CreateSut(
            embeddings.Object,
            identity.Object,
            index,
            new InMemoryRetrievalDocumentIndexCatalog(),
            caps.Object);

        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        RetrievalDocumentBuilder builder = new();
        RetrievalDocument first = builder.BuildForProvenance(
            TenantId,
            WorkspaceId,
            ProjectId,
            runId,
            GraphWithMarker("alpha-marker"))[0];
        RetrievalDocument second = builder.BuildForProvenance(
            TenantId,
            WorkspaceId,
            ProjectId,
            runId,
            GraphWithMarker("beta-marker"))[0];

        await sut.IndexDocumentsAsync([first], CancellationToken.None);
        await sut.IndexDocumentsAsync([second], CancellationToken.None);

        IReadOnlyList<RetrievalHit> hits = await index.SearchAsync(
            new RetrievalQuery
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                QueryText = "provenance",
                TopK = 5,
            },
            [1f, 0f, 0f, 0f],
            CancellationToken.None);

        hits.Should().Contain(hit => hit.Text.Contains("beta-marker", StringComparison.Ordinal));
        hits.Should().NotContain(hit => hit.Text.Contains("alpha-marker", StringComparison.Ordinal));
    }

    private static DecisionProvenanceGraph GraphWithMarker(string marker) =>
        new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Nodes =
            [
                new ProvenanceNode
                {
                    ReferenceId = marker,
                    Name = marker,
                },
            ],
        };
}
