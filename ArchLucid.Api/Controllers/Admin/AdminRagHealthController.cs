using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Operator-visible RAG corpus freshness for the current host process (TB-194).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminRagHealthController(
    IRetrievalDocumentIndexCatalog indexCatalog,
    IEmbeddingModelIdentity embeddingModelIdentity) : ControllerBase
{
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromHours(24);

    private readonly IRetrievalDocumentIndexCatalog _indexCatalog =
        indexCatalog ?? throw new ArgumentNullException(nameof(indexCatalog));

    private readonly IEmbeddingModelIdentity _embeddingModelIdentity =
        embeddingModelIdentity ?? throw new ArgumentNullException(nameof(embeddingModelIdentity));

    [HttpGet("rag-health")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(AdminRagHealthResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminRagHealthResponse> GetRagHealth()
    {
        DateTimeOffset staleBefore = TimeProvider.System.GetUtcNow().Subtract(StaleThreshold);
        int embeddingDimension = _embeddingModelIdentity.ExpectedDimension;

        AdminRagCorpusHealthItem[] corpora = _indexCatalog
            .GetCorpusFreshnessSummaries()
            .Select(summary => new AdminRagCorpusHealthItem
            {
                CorpusKind = summary.CorpusKind,
                ChunkCount = summary.DocumentCount,
                LastIndexedUtc = summary.LastIndexedUtc,
                EmbeddingDimension = embeddingDimension,
                IsStale = summary.LastIndexedUtc is null || summary.LastIndexedUtc < staleBefore
            })
            .ToArray();

        return Ok(
            new AdminRagHealthResponse
            {
                EmbeddingModelId = _embeddingModelIdentity.ModelId,
                Corpora = corpora
            });
    }
}
