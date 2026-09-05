namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceRbacAssignmentSummary
{
    public string Scope
    {
        get;
        set;
    } = string.Empty;

    public string PrincipalId
    {
        get;
        set;
    } = string.Empty;

    public string RoleDefinitionId
    {
        get;
        set;
    } = string.Empty;
}
