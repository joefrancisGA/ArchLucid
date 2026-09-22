namespace ArchLucid.ArtifactSynthesis.Graphviz;

public sealed class GraphvizDotEmitOptions
{
    /// <summary>
    /// Graphviz layout engine name. Inventory diagrams use <c>fdp</c> (force-directed), not layered <c>dot</c>.
    /// The renderer invokes <c>fdp -Tsvg</c>; this value is emitted as a graph attribute for documentation.
    /// Emitter also sets <c>sep</c>, <c>K</c>, and <c>pack</c> so force-directed clusters keep a little space.
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
