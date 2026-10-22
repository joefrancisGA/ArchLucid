using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Structured architecture diagram review input (IE-18 / AS-006).
///     Informal JSON shape:
///     <c>{ "nodes": [{ "id", "label", "kind?", "subgraphId?", "provenance?", "removed?", "accepted?" }],
///     "edges": [{ "id", "sourceId", "targetId", "label?", "provenance?", "removed?" }],
///     "subgraphs": [{ "id", "label", "parentSubgraphId?", "orderKey?" }],
///     "trustBoundaryLabels": ["..."],
///     "extractionMethod": "StructuredParse",
///     "sourceEvidenceItemId": "evidence-item-id?" }</c>
/// </summary>
public sealed class ArchitectureDiagramModelRecord
{
    private List<ArchitectureDiagramNodeRecord> nodes = [];

    public List<ArchitectureDiagramNodeRecord> Nodes
    {
        get => nodes;
        set => nodes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ArchitectureDiagramEdgeRecord> edges = [];

    public List<ArchitectureDiagramEdgeRecord> Edges
    {
        get => edges;
        set => edges = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ArchitectureDiagramSubgraphRecord> subgraphs = [];

    public List<ArchitectureDiagramSubgraphRecord> Subgraphs
    {
        get => subgraphs;
        set => subgraphs = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> trustBoundaryLabels = [];

    public List<string> TrustBoundaryLabels
    {
        get => trustBoundaryLabels;
        set => trustBoundaryLabels = ContractCollectionDefaults.Coalesce(value);
    }

    public string ExtractionMethod
    {
        get;
        set;
    } = DiagramExtractionMethods.StructuredParse;

    /// <summary>Optional evidence item that stored the original diagram source.</summary>
    public string? SourceEvidenceItemId
    {
        get;
        set;
    }
}
