using ArchLucid.Api.ProblemDetails;
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
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly RetrievalTools _retrievalTools =
        retrievalTools ?? throw new ArgumentNullException(nameof(retrievalTools));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    [HttpPost("policy-pack-search")]
    [MutatingAuditExcluded("Read-only retrieval tool.")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalMcpToolHit>), StatusCodes.Status200OK)]
    public Task<IActionResult> PolicyPackSearchAsync(
        [FromBody] McpRetrievalSearchBody body,
        CancellationToken cancellationToken) =>
        SearchAsync(body, _retrievalTools.PolicyPackSearchAsync, cancellationToken);

    [HttpPost("prior-decision-search")]
    [MutatingAuditExcluded("Read-only retrieval tool.")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalMcpToolHit>), StatusCodes.Status200OK)]
    public Task<IActionResult> PriorDecisionSearchAsync(
        [FromBody] McpRetrievalSearchBody body,
        CancellationToken cancellationToken) =>
        SearchAsync(body, _retrievalTools.PriorDecisionSearchAsync, cancellationToken);

    [HttpPost("price-row-lookup")]
    [MutatingAuditExcluded("Read-only retrieval tool.")]
    [ProducesResponseType(typeof(IReadOnlyList<RetrievalMcpToolHit>), StatusCodes.Status200OK)]
    public Task<IActionResult> PriceRowLookupAsync(
        [FromBody] McpRetrievalSearchBody body,
        CancellationToken cancellationToken) =>
        SearchAsync(body, _retrievalTools.PriceRowLookupAsync, cancellationToken);

    private async Task<IActionResult> SearchAsync(
        McpRetrievalSearchBody? body,
        Func<RetrievalMcpToolRequest, CancellationToken, Task<IReadOnlyList<RetrievalMcpToolHit>>> search,
        CancellationToken cancellationToken)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.QueryText))
            return this.BadRequestProblem("queryText is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        RetrievalMcpToolRequest request = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = body.QueryText.Trim(),
            TopK = body.TopK ?? 8
        };

        IReadOnlyList<RetrievalMcpToolHit> hits = await search(request, cancellationToken).ConfigureAwait(false);

        return Ok(hits);
    }
}

public sealed class McpRetrievalSearchBody
{
    public required string QueryText { get; init; }

    public int? TopK { get; init; }
}
