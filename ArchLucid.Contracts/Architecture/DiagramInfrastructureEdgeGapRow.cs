namespace ArchLucid.Contracts.Architecture;

public sealed class DiagramInfrastructureEdgeGapRow
{
    public string EdgeGapId
    {
        get;
        set;
    } = string.Empty;

    public Guid? FromCloudResourceId
    {
        get;
        set;
    }

    public Guid? ToCloudResourceId
    {
        get;
        set;
    }

    public string? DiagramEdgeId
    {
        get;
        set;
    }

    public string? AssociationType
    {
        get;
        set;
    }

    public string GapKind
    {
        get;
        set;
    } = string.Empty;

    public string ExplainText
    {
        get;
        set;
    } = string.Empty;
}
