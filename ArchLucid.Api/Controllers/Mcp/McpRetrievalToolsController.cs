using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Mcp.Tools;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Mcp;

/// <summary>HTTP bridge for read-only retrieval MCP tools until Streamable HTTP membrane ships (RAG-V1.1-002).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/mcp/retrieval")]
public sealed class McpRetrievalToolsController(
    RetrievalTools retrievalTools,
    IScopeContextProvider scopeContextProvider,
    IAskEvidenceAccess evidenceAccess,
    IRunRepository runRepository) : ControllerBase
{
    private readonly RetrievalTools _retrievalTools =
        retrievalTools ?? throw new ArgumentNullException(nameof(retrievalTools));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    // idempotency-posture: dry-run-no-persist
    [HttpPost("policy-pack-search")]
    [MutatingAuditExcluded("Read-only retrieval tool.")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalMcpToolHit>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> PolicyPackSearchAsync(
        [FromBody] McpRetrievalSearchBody body,
        CancellationToken cancellationToken) =>
        SearchAsync(body, async (_, request, ct) => await _retrievalTools.PolicyPackSearchAsync(request, ct), cancellationToken);

    // idempotency-posture: dry-run-no-persist
    [HttpPost("prior-decision-search")]
    [MutatingAuditExcluded("Read-only retrieval tool.")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalMcpToolHit>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<IActionResult> PriorDecisionSearchAsync(
        [FromBody] McpRetrievalSearchBody body,
        CancellationToken cancellationToken) =>
        SearchAsync(body, async (scope, request, ct) =>
        {
            HashSet<Guid>? allowed = await AuthorizedEvidenceRunResolver.ResolveProjectAsync(
                runRepository, scope, (id, token) => evidenceAccess.CanReadRunAsync(scope, id, token), ct);
            if (allowed is null)
                return null;

            return await _retrievalTools.PriorDecisionSearchAsync(request, allowed, ct);
        }, cancellationToken);

    // idempotency-posture: dry-run-no-persist
    [HttpPost("price-row-lookup")]
    [MutatingAuditExcluded("Read-only retrieval tool.")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalMcpToolHit>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> PriceRowLookupAsync(
        [FromBody] McpRetrievalSearchBody body,
        CancellationToken cancellationToken) =>
        SearchAsync(body, async (_, request, ct) => await _retrievalTools.PriceRowLookupAsync(request, ct), cancellationToken);

    private async Task<IActionResult> SearchAsync(
        McpRetrievalSearchBody? body,
        Func<ScopeContext, RetrievalMcpToolRequest, CancellationToken, Task<IReadOnlyList<RetrievalMcpToolHit>?>> search,
        CancellationToken cancellationToken)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.QueryText))
            return this.BadRequestProblem("queryText is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            string.IsNullOrWhiteSpace(evidenceAccess.GetAuthorizedActorId()))
            return this.NotFoundProblem("Retrieval evidence is not available for the current caller.",
                ProblemTypes.ResourceNotFound);

        RetrievalMcpToolRequest request = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = body.QueryText.Trim(),
            TopK = body.TopK ?? 8
        };

        IReadOnlyList<RetrievalMcpToolHit>? hits = await search(scope, request, cancellationToken).ConfigureAwait(false);
        if (hits is null)
            return this.ConflictProblem("Project-wide retrieval authorization budget exceeded.", ProblemTypes.Conflict);

        return Ok(hits);
    }
}

public sealed class McpRetrievalSearchBody
{
    public required string QueryText { get; init; }

    public int? TopK { get; init; }
}
