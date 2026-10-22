using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Admin;

public sealed class UserInvitationListResponse
{
    private IReadOnlyList<UserInvitationResponse> invitations = [];

    public IReadOnlyList<UserInvitationResponse> Invitations
    {
        get => invitations;
        set => invitations = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
