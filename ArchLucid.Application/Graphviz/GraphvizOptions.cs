namespace ArchLucid.Application.Graphviz;

public sealed class GraphvizOptions
{
    public const string SectionName = "ArchLucid:Graphviz";

    public bool Enabled
    {
        get;
        set;
    } = true;

    public string FdpPath
    {
        get;
        set;
    } = "fdp";
}
