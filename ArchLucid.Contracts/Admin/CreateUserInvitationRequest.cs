namespace ArchLucid.Contracts.Admin;

public sealed class CreateUserInvitationRequest
{
    public string Email
    {
        get;
        set;
    } = string.Empty;

    public string AppRole
    {
        get;
        set;
    } = string.Empty;

    public string? Message
    {
        get;
        set;
    }
}
