namespace ArchLucid.Api.Models.Graph;

/// <summary>Wire format compatible with common Cytoscape.js ingestion patterns (<c>elements.nodes</c> / <c>elements.edges</c>).</summary>
public sealed class CytoscapeInteractiveGraphResponse
{
    public required CytoscapeElementsGroup Elements
    {
        get;
        init;
    }

    /// <summary>ArchLucid graph snapshot row identifier echoed for client cache invalidation.</summary>
    public Guid GraphSnapshotId
    {
        get;
        init;
    }

    /// <summary>Owning architecture run identifier echoed for linkage back to canonical run APIs.</summary>
    public Guid RunId
    {
        get;
        init;
    }
}
