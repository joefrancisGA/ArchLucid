namespace ArchLucid.Core.Identity;

/// <summary>Claim-to-role mapping persisted in <c>ClaimMappingJson</c>.</summary>
public sealed class IdentityClaimRoleMappingDocument
{
    /// <summary>IdP claim name carrying group or role values (e.g. <c>groups</c>, <c>roles</c>).</summary>
    public string RoleClaimName { get; init; } = string.Empty;

    /// <summary>Explicit IdP value → ArchLucid role mappings.</summary>
    public IReadOnlyList<IdentityClaimRoleMappingEntry> Mappings { get; init; } = [];

    /// <summary>Optional regex applied to each claim value for custom group naming conventions.</summary>
    public string? CustomGroupClaimRegex { get; init; }
}
