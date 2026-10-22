namespace ArchLucid.Application.Notifications.Email;

/// <summary>Validated claims embedded in a digest sponsor deep-link token (TB-2196).</summary>
public sealed record ExecDigestSponsorDeepLinkClaims(
    ExecDigestSponsorDeepLinkTarget Target,
    Guid TenantId,
    string IsoWeekKey,
    string? RunIdHex);
