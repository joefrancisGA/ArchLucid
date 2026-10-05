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
                    Label = n.Name,
                    Type = n.Type.ToString(),
                    AgentExecutionTraceId = n.AgentExecutionTraceId,
                    Metadata = n.Metadata.Count > 0
                        ? new Dictionary<string, string>(n.Metadata)
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
