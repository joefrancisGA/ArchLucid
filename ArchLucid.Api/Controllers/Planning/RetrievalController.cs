using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Retrieval;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     HTTP semantic search over retrieval chunks scoped to the caller’s tenant/workspace/project.
/// </summary>
/// <remarks>
///     GET <c>api/retrieval/search</c>; delegates to <see cref="IRetrievalQueryService" /> (same path used indirectly
///     by <c>AskService</c>).
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/retrieval")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class RetrievalController(
    IRetrievalQueryService retrievalQueryService,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IArchitectureShareAccessGate architectureShareAccessGate,
    IRunRepository runRepository)
    : ControllerBase
{
    /// <summary>Runs a vector search for query string <paramref name="q" />.</summary>
    /// <param name="q">Required natural-language query.</param>
    /// <param name="runId">Optional run filter.</param>
    /// <param name="manifestId">Optional manifest filter.</param>
    /// <param name="topK">Result count (clamped to 1–50; invalid values default to 8).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><see cref="RetrievalHit" /> list, or 400 when <paramref name="q" /> is missing.</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalHit>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] Guid? runId = null,
        [FromQuery] Guid? manifestId = null,
        [FromQuery] int topK = 8,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q))
            return this.BadRequestProblem(
                "Query parameter 'q' is required.",
                ProblemTypes.ValidationFailed);

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            (Guid? resolvedRunId, HashSet<Guid> authorizedRuns, IActionResult? rejection) =
                await ResolveAuthorizedRetrievalRunsAsync(scope, runId, manifestId, ct);

            if (rejection is not null)
                return rejection;

            IActionResult? sealedGuardResult = manifestId is Guid exactManifestId
                ? await EnsureExactRetrievalManifestSealedReadAsync(scope, resolvedRunId!.Value, exactManifestId, ct)
                : await EnsureRunScopedRetrievalSealedManifestReadAllowedAsync(resolvedRunId, ct);

            if (sealedGuardResult is not null)
                return sealedGuardResult;

            if (authorizedRuns.Count == 0)
                return Ok(Array.Empty<RetrievalHit>());

            IReadOnlyList<RetrievalHit> result = await retrievalQueryService.SearchAsync(
                new RetrievalQuery
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = resolvedRunId,
                    AuthorizedEvidenceRunIds = authorizedRuns,
                    ManifestId = manifestId,
                    QueryText = q.Trim(),
                    TopK = topK < 1 ? 8 : Math.Min(topK, 50)
                },
                ct);

            return Ok(result);
        }
        catch (ConflictException ex)
        {
            return MapRetrievalSealedManifestConflict(ex);
        }
    }
}
