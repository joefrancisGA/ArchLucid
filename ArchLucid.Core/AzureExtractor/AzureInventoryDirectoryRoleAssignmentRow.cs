using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureInventoryDirectoryRoleAssignmentRow
{
    public string PrincipalId
    {
        get;
        init;
    } = string.Empty;

    public string? PrincipalType
    {
        get;
        init;
    }

    public string RoleDefinitionId
    {
        get;
        init;
    } = string.Empty;

    public string? RoleDefinitionTemplateId
    {
        get;
        init;
    }

    public string DirectoryScopeId
    {
        get;
        init;
    } = string.Empty;

    public string? RoleName
    {
        get;
        init;
    }

    public string? PimEligibilityKind
    {
        get;
        init;
    }

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    } = ProvenanceKind.HumanAssertion;

    public byte[]? EvidenceHashSha256
    {
        get;
        init;
    }

    public string PrincipalNodeId => AzureInventoryPrincipalNodeId.Format(PrincipalId);
}
