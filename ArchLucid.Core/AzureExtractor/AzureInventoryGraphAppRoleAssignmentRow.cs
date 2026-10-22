using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureInventoryGraphAppRoleAssignmentRow
{
    public string PrincipalId
    {
        get;
        init;
    } = string.Empty;

    public string ResourceId
    {
        get;
        init;
    } = string.Empty;

    public string AppRoleId
    {
        get;
        init;
    } = string.Empty;

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
