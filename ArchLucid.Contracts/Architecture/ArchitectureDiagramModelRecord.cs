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
    public List<ArchitectureDiagramNodeRecord> Nodes
    {
        get;
        set;
    } = [];

    public List<ArchitectureDiagramEdgeRecord> Edges
    {
        get;
        set;
    } = [];

    public List<ArchitectureDiagramSubgraphRecord> Subgraphs
    {
        get;
        set;
    } = [];

    public List<string> TrustBoundaryLabels
    {
        get;
        set;
    } = [];

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
