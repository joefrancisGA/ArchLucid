namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryRoleAssignmentWrite
{
    public string Scope
    {
        get;
        init;
    } = string.Empty;

    public string PrincipalId
    {
        get;
        init;
    } = string.Empty;

    public string RoleDefinitionId
    {
        get;
        init;
    } = string.Empty;

    public string? RoleDefinitionName
    {
        get;
        init;
    }

    public string? PimEligibilityKind
    {
        get;
        init;
    }

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}
