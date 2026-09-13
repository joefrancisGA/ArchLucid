namespace ArchLucid.Application.Graphviz;

public sealed class GraphvizLayoutRenderResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? Svg
    {
        get;
        init;
    }

    public byte[]? Png
    {
        get;
        init;
    }

    public string? Error
    {
        get;
        init;
    }
}
