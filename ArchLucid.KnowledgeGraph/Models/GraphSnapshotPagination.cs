using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Models;

/// <summary>Compatibility forwarder; canonical helper is <see cref="ArchLucid.Core.Persistence.Graph.GraphSnapshotPagination" />.</summary>
public static class GraphSnapshotPagination
{
    public static ArchLucid.Core.Persistence.Graph.GraphSnapshotNodesPage CreatePage(
        GraphSnapshot snapshot,
        int page,
        int pageSize) =>
        ArchLucid.Core.Persistence.Graph.GraphSnapshotPagination.CreatePage(snapshot, page, pageSize);
}
