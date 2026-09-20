namespace ArchLucid.ArtifactSynthesis.Models;

public class DiagramAst
{
    public string Title
    {
        get;
        set;
    } = null!;

    public List<DiagramNode> Nodes
    {
        get;
        set;
    } = [];

    public List<DiagramEdge> Edges
    {
        get;
        set;
    } = [];

    public List<DiagramSubgraph> Subgraphs
    {
        get;
        set;
    } = [];

    /// <summary>Mermaid flowchart direction (TD or LR). Defaults to top-down for inventory modes.</summary>
    public string FlowchartDirection
    {
        get;
        set;
    } = "TD";

    /// <summary>Operator-visible caption lines rendered once beneath the diagram title.</summary>
    public List<string> CaptionLines
    {
        get;
        set;
    } = [];
}
