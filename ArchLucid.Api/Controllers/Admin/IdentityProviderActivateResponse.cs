namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Response after activating tenant SSO configuration.</summary>
public sealed class IdentityProviderActivateResponse
{
    public Guid TenantId { get; init; }

    public bool IsActive { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}
