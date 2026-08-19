namespace ArchLucid.Api.Models.Graph;

public sealed class CytoscapeNodeData
{
    public required string Id
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }

    public string? NodeType
    {
        get;
        init;
    }

    public string? Category
    {
        get;
        init;
    }

    /// <summary>Original domain source id retained for richer client tooltips.</summary>
    public string? SourceEntityId
    {
        get;
        init;
    }
}
