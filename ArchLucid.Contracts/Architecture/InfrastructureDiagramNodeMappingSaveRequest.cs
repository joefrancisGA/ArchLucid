namespace ArchLucid.Contracts.Architecture;

public sealed class InfrastructureDiagramNodeMappingSaveRequest
{
    public string NormalizedDiagramLabel
    {
        get;
        set;
    } = string.Empty;

    public string? DiagramNodeId
    {
        get;
        set;
    }

    public Guid CloudResourceId
    {
        get;
        set;
    }
}
