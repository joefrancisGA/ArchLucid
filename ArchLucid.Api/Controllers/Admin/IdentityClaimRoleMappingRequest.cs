namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Claim-to-role mapping submitted by the SSO wizard.</summary>
public sealed class IdentityClaimRoleMappingRequest
{
    public string RoleClaimName { get; init; } = string.Empty;

    public IReadOnlyList<IdentityClaimRoleMappingEntryRequest> Mappings { get; init; } = [];

    public string? CustomGroupClaimRegex { get; init; }
}
