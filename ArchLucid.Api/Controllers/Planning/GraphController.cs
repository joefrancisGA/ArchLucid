using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     HTTP API for retrieving the architecture knowledge graph snapshot associated with a run.
/// </summary>
/// <remarks>
///     Routes are prefixed <c>api/graph</c> and require the <see cref="ArchLucidPolicies.ReadAuthority" /> policy.
///     The graph is projected from the <see cref="ArchLucid.KnowledgeGraph.Models.GraphSnapshot" /> stored in the
///     canonical run detail and returned as a <see cref="GraphViewModel" /> with typed node and edge view models.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/graph")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class GraphController(
    IAuthorityQueryService authorityQueryService,
    IRunRepository runRepository,
    IScopeContextProvider scopeProvider,
    IOptions<KnowledgeGraphLimitsOptions> knowledgeGraphLimits)
    : ControllerBase
{
    /// <summary>
    ///     Returns a <see cref="GraphViewModel" /> for <paramref name="runId" /> when a graph snapshot exists in the caller’s
    ///     scope.
    /// </summary>
    [HttpGet("runs/{runId:guid}")]
    [ProducesResponseType(typeof(GraphViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<IActionResult> GetArchitectureGraph(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        if (detail.GraphSnapshot is null)
            return this.NotFoundProblem($"Run '{runId}' does not have a graph snapshot.",
                ProblemTypes.ResourceNotFound);

        KnowledgeGraphLimitsOptions limits = knowledgeGraphLimits.Value;

        if (limits.FullGraphResponseMaxNodes > 0 &&
            detail.GraphSnapshot.Nodes.Count > limits.FullGraphResponseMaxNodes)
        {
            return this.PayloadTooLargeProblem(
                $"This graph has {detail.GraphSnapshot.Nodes.Count} nodes; the full-graph endpoint allows at most "
                + $"{limits.FullGraphResponseMaxNodes}. Use GET /v1/graph/runs/{runId}/nodes with page and pageSize "
                + $"(maximum page size {PaginationDefaults.MaxPageSize}).",
                ProblemTypes.GraphTooLargeForFullResponse);
        }

        GraphViewModel vm = MapArchitectureGraph(detail.GraphSnapshot);
        return Ok(vm);
    }

    /// <summary>
    ///     Returns a page of graph nodes (stable snapshot order) and edges whose endpoints both appear on that page.
    /// </summary>
    [HttpGet("runs/{runId:guid}/nodes")]
    [ProducesResponseType(typeof(GraphNodesPageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitectureGraphNodesPage(
        Guid runId,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        if (detail.GraphSnapshot is null)
            return this.NotFoundProblem($"Run '{runId}' does not have a graph snapshot.",
                ProblemTypes.ResourceNotFound);

        GraphSnapshotNodesPage slice = GraphSnapshotPagination.CreatePage(detail.GraphSnapshot, page, pageSize);
        GraphNodesPageResponse body = MapArchitectureGraphPage(slice);
        return Ok(body);
    }

    /// <summary>
    ///     Architecture graph reconstructed at <paramref name="asOf"/> from the anchored review’s authority project lineage
    ///     (latest committed run ≤ <paramref name="asOf"/> with a persisted graph snapshot).
    /// </summary>
    [HttpGet("snapshot")]
    [ProducesResponseType(typeof(ArchitectureGraphTemporalSnapshotResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<IActionResult> GetArchitectureGraphTemporalSnapshot(
        [FromQuery] Guid runId,
        [FromQuery] DateTimeOffset? asOf,
        CancellationToken ct = default)
    {
        if (runId == Guid.Empty)
            return this.BadRequestProblem("Query parameter \"runId\" is required.");

        if (!asOf.HasValue)
            return this.BadRequestProblem("Query parameter \"asOf\" is required.");

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RunRecord? anchor = await runRepository.GetByIdAsync(scope, runId, ct);
        if (anchor is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        DateTime boundaryUtc = DateTime.SpecifyKind(asOf.Value.UtcDateTime, DateTimeKind.Utc);

        RunRecord? resolved =
            await runRepository.GetLatestWithGraphAtOrBeforeAsync(scope, anchor.ProjectId, boundaryUtc, ct);

        if (resolved is null)
        {
            return this.NotFoundProblem(
                $"No persisted architecture graph exists for project '{anchor.ProjectId}' at or before the requested instant.",
                ProblemTypes.ResourceNotFound);
        }

        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, resolved.RunId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{resolved.RunId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.GraphSnapshot is null)
        {
            return this.NotFoundProblem(
                $"Run '{resolved.RunId}' does not have a graph snapshot.",
                ProblemTypes.ResourceNotFound);
        }

        KnowledgeGraphLimitsOptions limits = knowledgeGraphLimits.Value;

        if (limits.FullGraphResponseMaxNodes > 0 &&
            detail.GraphSnapshot.Nodes.Count > limits.FullGraphResponseMaxNodes)
        {
            return this.PayloadTooLargeProblem(
                $"This graph has {detail.GraphSnapshot.Nodes.Count} nodes; the temporal snapshot endpoint allows at most "
                + $"{limits.FullGraphResponseMaxNodes} for resolved run '{resolved.RunId:D}'. Use GET /v1/graph/runs/{resolved.RunId:D}/nodes with page/pageSize (resolvedRunId returned in this problem).",
                ProblemTypes.GraphTooLargeForFullResponse,
                extensions: new Dictionary<string, object?> { ["resolvedRunId"] = resolved.RunId });
        }

        GraphViewModel graph = MapArchitectureGraph(detail.GraphSnapshot);
        ArchitectureGraphTemporalSnapshotResponse body = new()
        {
            ResolvedRunId = resolved.RunId,
            AsOfUtc = new DateTimeOffset(DateTime.SpecifyKind(boundaryUtc, DateTimeKind.Utc), TimeSpan.Zero),
            ResolvedRunCreatedUtc = DateTime.SpecifyKind(resolved.CreatedUtc.ToUniversalTime(), DateTimeKind.Utc),
            Graph = graph
        };

        return Ok(body);
    }

    private static GraphViewModel MapArchitectureGraph(GraphSnapshot snapshot)
    {
        List<GraphNodeVm> nodes = snapshot.Nodes.Select(MapNode).ToList();
        List<GraphEdgeVm> edges = snapshot.Edges.Select(MapEdge).ToList();

        return new GraphViewModel { Nodes = nodes, Edges = edges };
    }

    private static GraphNodesPageResponse MapArchitectureGraphPage(GraphSnapshotNodesPage slice)
    {
        List<GraphNodeVm> nodes = slice.Nodes.Select(MapNode).ToList();
        List<GraphEdgeVm> edges = slice.Edges.Select(MapEdge).ToList();

        return new GraphNodesPageResponse
        {
            Page = slice.Page,
            PageSize = slice.PageSize,
            TotalNodes = slice.TotalNodes,
            HasMore = slice.HasMore,
            Nodes = nodes,
            Edges = edges
        };
    }

    private static GraphNodeVm MapNode(GraphNode x)
    {
        Dictionary<string, string> meta = new(StringComparer.OrdinalIgnoreCase);

        // Known structured fields take priority over raw property bag entries.
        if (!string.IsNullOrEmpty(x.Category))
            meta["category"] = x.Category;
        if (!string.IsNullOrEmpty(x.SourceType))
            meta["sourceType"] = x.SourceType;
        if (!string.IsNullOrEmpty(x.SourceId))
            meta["sourceId"] = x.SourceId;

        // Additional properties are merged; duplicate keys from Properties are skipped.
        foreach (KeyValuePair<string, string> kv in x.Properties)
            meta.TryAdd(kv.Key, kv.Value);

        return new GraphNodeVm
        {
            Id = x.NodeId,
            Label = x.Label,
            Type = x.NodeType,
            Metadata = meta.Count > 0 ? meta : null,
            ReasoningTrace = x.ReasoningTrace
        };
    }

    private static GraphEdgeVm MapEdge(GraphEdge e)
    {
        return new GraphEdgeVm
        {
            Id = e.EdgeId,
            Source = e.FromNodeId,
            Target = e.ToNodeId,
            Type = e.EdgeType,
            Label = e.Label,
            InferenceSource = e.InferenceSource,
            ReasoningTrace = e.ReasoningTrace
        };
    }
}
