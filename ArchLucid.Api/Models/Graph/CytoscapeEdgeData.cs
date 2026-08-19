namespace ArchLucid.Api.Models.Graph;

public sealed class CytoscapeEdgeData
{
    public required string Id
    {
        get;
        init;
    }

    public required string Source
    {
        get;
        init;
    }

    public required string Target
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }

    public string? EdgeType
    {
        get;
        init;
    }
}
