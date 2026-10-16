using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Graph;

public class GraphBuildResult
{
    private List<GraphNode> nodes = [];

    public List<GraphNode> Nodes
    {
        get => nodes;
        set => nodes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<GraphEdge> edges = [];

    public List<GraphEdge> Edges
    {
        get => edges;
        set => edges = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> warnings = [];

    public List<string> Warnings
    {
        get => warnings;
        set => warnings = ContractCollectionDefaults.Coalesce(value);
    }
}

