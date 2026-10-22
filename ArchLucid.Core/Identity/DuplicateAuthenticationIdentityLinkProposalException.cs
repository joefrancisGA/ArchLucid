namespace ArchLucid.Core.Identity;

public sealed class DuplicateAuthenticationIdentityLinkProposalException : Exception
{
    public DuplicateAuthenticationIdentityLinkProposalException(Guid proposalId)
        : base($"Authentication identity link proposal '{proposalId:D}' already exists.")
    {
        ProposalId = proposalId;
    }

    public Guid ProposalId
    {
        get;
    }
}
