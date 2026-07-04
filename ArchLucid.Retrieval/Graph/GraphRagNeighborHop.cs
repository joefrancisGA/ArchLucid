using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Knowledge-graph neighbor discovered at a specific hop distance from a seed hit.</summary>
internal sealed record GraphRagNeighborHop(GraphNode Node, int HopDistance);
