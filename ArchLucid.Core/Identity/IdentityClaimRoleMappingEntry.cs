namespace ArchLucid.Core.Identity;

/// <summary>Maps a single IdP group / role claim value to an ArchLucid role.</summary>
public sealed class IdentityClaimRoleMappingEntry
{
    public string IdpValue { get; init; } = string.Empty;

    public string ArchLucidRole { get; init; } = string.Empty;
}
