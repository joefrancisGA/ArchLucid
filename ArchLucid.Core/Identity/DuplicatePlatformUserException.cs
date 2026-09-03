namespace ArchLucid.Core.Identity;

public sealed class DuplicatePlatformUserException : Exception
{
    public DuplicatePlatformUserException(Guid userId)
        : base($"Platform user '{userId:D}' already exists.")
    {
        UserId = userId;
    }

    public Guid UserId
    {
        get;
    }
}
