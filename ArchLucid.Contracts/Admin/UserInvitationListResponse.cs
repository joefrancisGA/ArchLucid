namespace ArchLucid.Contracts.Admin;

public sealed class UserInvitationListResponse
{
    public IReadOnlyList<UserInvitationResponse> Invitations
    {
        get;
        set;
    } = [];
}
