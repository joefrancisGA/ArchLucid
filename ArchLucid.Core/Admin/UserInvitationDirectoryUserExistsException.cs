namespace ArchLucid.Core.Admin;

public sealed class UserInvitationDirectoryUserExistsException(string email) : Exception(
    $"A directory user already exists for '{email}'.")
{
    public string Email { get; } = email;
}
