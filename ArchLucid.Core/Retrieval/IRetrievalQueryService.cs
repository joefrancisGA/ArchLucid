namespace ArchLucid.Core.Retrieval;

/// <summary>
///     High-level semantic search over indexed retrieval chunks for a scoped query.
/// </summary>
/// <remarks>
///     Implementation: <c>ArchLucid.Retrieval.Queries.RetrievalQueryService</c>. Callers:
///     <c>ArchLucid.Host.Core.Services.Ask.AskService</c>,
///     <c>ArchLucid.Api.Controllers.Planning.RetrievalController</c>.
/// </remarks>
public interface IRetrievalQueryService
{
    /// <summary>
    ///     Embeds <see cref="RetrievalQuery.QueryText" /> then queries the configured vector index.
    /// </summary>
    /// <param name="query">Scope, optional run/manifest filters, text, and <see cref="RetrievalQuery.TopK" />.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Ranked hits; may be empty when nothing is indexed or filters exclude all chunks.</returns>
    Task<IReadOnlyList<RetrievalHit>> SearchAsync(RetrievalQuery query, CancellationToken ct);
}
