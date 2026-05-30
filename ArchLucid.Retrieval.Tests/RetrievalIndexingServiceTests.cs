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
        IScopeContextProvider? scopeContextProvider = null)
    {
        IScopeContextProvider scope = scopeContextProvider ?? CreateMatchingScopeProvider();

        return new RetrievalIndexingService(
            new SimpleTextChunker(),
            new PolicyPackChunker(),
            new PriorManifestChunker(),
            embeddings,
            identity,
            index,
            catalog,
            caps,
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
}
