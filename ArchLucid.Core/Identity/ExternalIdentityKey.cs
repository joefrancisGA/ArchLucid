namespace ArchLucid.Core.Identity;

/// <summary>Durable external identity lookup key (issuer + subject + provider context).</summary>
public sealed class ExternalIdentityKey
{
    public AuthenticationProviderType ProviderType
    {
        get;
        init;
    }

    public string NormalizedIssuer
    {
        get;
        init;
    } = string.Empty;

    public string Subject
    {
        get;
        init;
    } = string.Empty;

    public Guid? TenantId
    {
        get;
        init;
    }

    public Guid? TenantIdentityProviderId
    {
        get;
        init;
    }
}
