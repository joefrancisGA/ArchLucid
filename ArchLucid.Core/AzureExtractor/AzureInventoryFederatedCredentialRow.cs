using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureInventoryFederatedCredentialRow
{
    public string Issuer
    {
        get;
        init;
    } = string.Empty;

    public string Subject
    {
        get;
        init;
    } = string.Empty;

    public string PrincipalId
    {
        get;
        init;
    } = string.Empty;

    public string? AppId
    {
        get;
        init;
    }

    public string? ParentResourceId
    {
        get;
        init;
    }

    public string? CredentialName
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

    public string NodeId => AzureInventoryFederatedCredentialNodeId.Format(Issuer, Subject);

    public string PrincipalNodeId => AzureInventoryPrincipalNodeId.Format(PrincipalId);
}
