namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SharedControlBlastRadiusCandidate
{
    public IReadOnlyList<PrivilegePathEdge> Hops
    {
        get;
        init;
    } = [];

    public SharedControlBlastRadiusControlKind ControlKind
    {
        get;
        init;
    }

    public string ControlNodeId
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> DependentNodeIds
    {
        get;
        init;
    } = [];

    public int DependentCount
    {
        get;
        init;
    }

    public Guid? ControlCloudResourceId
    {
        get;
        init;
    }

    public string? ControlResourceType
    {
        get;
        init;
    }
}
