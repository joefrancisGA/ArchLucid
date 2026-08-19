using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;

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
        AdminRagHealthResponse expected = new()
        {
            EmbeddingModelId = "text-embedding-3-small",
            Corpora =
            [
                new AdminRagCorpusHealthItem
                {
                    CorpusKind = "PolicyPack",
                    ChunkCount = 4,
                    LastIndexedUtc = DateTimeOffset.UtcNow.AddHours(-1),
                    EmbeddingDimension = 1536,
                    IsStale = false,
                },
            ],
        };

        Mock<IAdminRagHealthQuery> query = new();
        query.Setup(q => q.GetRagHealth()).Returns(expected);

        AdminRagHealthController sut = new(query.Object);

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
