namespace ArchLucid.Core.Identity;

public sealed class DuplicatePlatformTenantAuthRecoveryGrantException : Exception
{
    public DuplicatePlatformTenantAuthRecoveryGrantException(Guid grantId)
        : base($"Platform tenant auth recovery grant '{grantId:D}' already exists.")
    {
        GrantId = grantId;
    }

    public Guid GrantId
    {
        get;
    }
}
