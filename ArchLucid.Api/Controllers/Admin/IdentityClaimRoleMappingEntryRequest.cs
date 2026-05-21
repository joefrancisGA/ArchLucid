namespace ArchLucid.Api.Controllers.Admin;

public sealed class IdentityClaimRoleMappingEntryRequest
{
    public string IdpValue { get; init; } = string.Empty;

    public string ArchLucidRole { get; init; } = string.Empty;
}
