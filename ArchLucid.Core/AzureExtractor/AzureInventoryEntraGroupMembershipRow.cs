using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureInventoryEntraGroupMembershipRow
{
    public string MemberId
    {
        get;
        init;
    } = string.Empty;

    public string GroupId
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

    public string MemberNodeId => AzureInventoryPrincipalNodeId.Format(MemberId);

    public string GroupNodeId => AzureInventoryPrincipalNodeId.Format(GroupId);
}
