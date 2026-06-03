using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminRagHealthControllerTests
{
    [SkippableFact]
    public void GetRagHealth_returns_corpus_rows_with_embedding_dimension()
    {
        Mock<IRetrievalDocumentIndexCatalog> catalog = new();
        catalog
            .Setup(c => c.GetCorpusFreshnessSummaries())
            .Returns(
            [
                new RetrievalCorpusFreshnessSummary
                {
                    CorpusKind = "PolicyPack",
                    DocumentCount = 4,
                    LastIndexedUtc = DateTimeOffset.UtcNow.AddHours(-1)
                }
            ]);

        Mock<IEmbeddingModelIdentity> embedding = new();
        embedding.Setup(e => e.ModelId).Returns("text-embedding-3-small");
        embedding.Setup(e => e.ExpectedDimension).Returns(1536);

        AdminRagHealthController sut = new(catalog.Object, embedding.Object);

        ActionResult<AdminRagHealthResponse> result = sut.GetRagHealth();

        OkObjectResult ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        AdminRagHealthResponse body = ok.Value.Should().BeOfType<AdminRagHealthResponse>().Subject;
        body.EmbeddingModelId.Should().Be("text-embedding-3-small");
        body.Corpora.Should().ContainSingle();
        body.Corpora[0].CorpusKind.Should().Be("PolicyPack");
        body.Corpora[0].EmbeddingDimension.Should().Be(1536);
        body.Corpora[0].IsStale.Should().BeFalse();
    }
}
