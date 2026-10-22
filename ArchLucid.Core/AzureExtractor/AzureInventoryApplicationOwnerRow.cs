using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureInventoryApplicationOwnerRow
{
    public string AppObjectId
    {
        get;
        init;
    } = string.Empty;

    public string AppId
    {
        get;
        init;
    } = string.Empty;

    public string OwnerId
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

    public string OwnerNodeId => AzureInventoryPrincipalNodeId.Format(OwnerId);
}
