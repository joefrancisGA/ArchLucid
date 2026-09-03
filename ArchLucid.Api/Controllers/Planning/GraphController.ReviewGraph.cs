using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class GraphController
{
    /// <summary>
    ///     Returns a <see cref="GraphViewModel" /> for <paramref name="runId" /> when a graph snapshot exists in the caller’s
    ///     scope.
    /// </summary>
    [HttpGet("reviews/{runId:guid}")]
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
                + $"{limits.FullGraphResponseMaxNodes}. Use GET /v1/evidence-graph/reviews/{runId}/nodes with page and pageSize "
                + $"(maximum page size {PaginationDefaults.MaxPageSize}).",
                ProblemTypes.GraphTooLargeForFullResponse);
        }

        GraphViewModel vm = MapArchitectureGraph(detail.GraphSnapshot);
        return Ok(vm);
    }

    /// <summary>
    ///     Returns a page of graph nodes (stable snapshot order) and edges whose endpoints both appear on that page.
    /// </summary>
    [HttpGet("reviews/{runId:guid}/nodes")]
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
