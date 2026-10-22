namespace ArchLucid.Provenance.Services;

public static class ProvenanceGraphViewMapper
{
    public static GraphViewModel ToViewModel(DecisionProvenanceGraph graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        IReadOnlyList<ProvenanceNode> nodes = graph.Nodes ?? [];
        IReadOnlyList<ProvenanceEdge> edges = graph.Edges ?? [];

        return new GraphViewModel
        {
            Nodes = nodes
                .Select(n => new GraphNodeVm
                {
                    Id = n.Id.ToString("D"),
                    Label = string.IsNullOrWhiteSpace(n.Name) ? n.Name ?? string.Empty : n.Name.Trim(),
                    Type = n.Type.ToString(),
                    AgentExecutionTraceId = string.IsNullOrWhiteSpace(n.AgentExecutionTraceId)
                        ? n.AgentExecutionTraceId
                        : n.AgentExecutionTraceId.Trim(),
                    Metadata = n.Metadata is { Count: > 0 } metadata
                        ? new Dictionary<string, string>(metadata)
                        : null
                })
                .ToList(),
            Edges = edges
                .Select(e => new GraphEdgeVm
                {
                    Source = e.FromNodeId.ToString("D"), Target = e.ToNodeId.ToString("D"), Type = e.Type.ToString()
                })
                .ToList()
        };
    }
}
