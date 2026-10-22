namespace ArchLucid.Core.Identity;

public sealed class DuplicateAuthenticationIdentityException : Exception
{
    public DuplicateAuthenticationIdentityException(ExternalIdentityKey key)
        : base("An authentication identity with the same external key already exists.")
    {
        Key = key;
    }

    public ExternalIdentityKey Key
    {
        get;
    }
}

public sealed class CrossTenantIdentityAttachmentException : Exception
{
    public CrossTenantIdentityAttachmentException(string message)
        : base(message)
    {
    }
}

public sealed class UnverifiedEmailIdentityAssociationException : Exception
{
    public UnverifiedEmailIdentityAssociationException()
        : base("Unverified email claims cannot be used for automatic identity association.")
    {
    }
}

public sealed class FinalSignInMethodRemovalException : Exception
{
    public FinalSignInMethodRemovalException()
        : base("Cannot disable the last valid sign-in method for this user.")
    {
    }
}

public sealed class PlatformUserNotFoundException : Exception
{
    public PlatformUserNotFoundException(Guid userId)
        : base($"Platform user '{userId:D}' was not found.")
    {
        UserId = userId;
    }

    public Guid UserId
    {
        get;
    }
}
