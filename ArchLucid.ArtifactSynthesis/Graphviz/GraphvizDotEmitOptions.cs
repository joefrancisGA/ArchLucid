namespace ArchLucid.ArtifactSynthesis.Graphviz;

public sealed class GraphvizDotEmitOptions
{
    /// <summary>
    /// Graphviz layout engine name. Inventory diagrams use <c>fdp</c> (force-directed), not layered <c>dot</c>.
    /// The renderer invokes <c>fdp -Tsvg</c>; this value is emitted as a graph attribute for documentation.
    /// </summary>
    public string LayoutEngine
    {
        get;
        set;
    } = "fdp";

    public string DigraphName
    {
        get;
        set;
    } = "Inventory";
}
