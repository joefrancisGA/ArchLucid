namespace ArchiForge.KnowledgeGraph.Models;

public class GraphBuildResult
{
    public List<GraphNode> Nodes { get; set; } = new();

    public List<GraphEdge> Edges { get; set; } = new();

    public List<string> Warnings { get; set; } = new();
}

