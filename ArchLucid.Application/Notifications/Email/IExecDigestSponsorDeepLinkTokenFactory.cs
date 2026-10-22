namespace ArchLucid.Application.Notifications.Email;

/// <summary>
///     Creates opaque read-only sponsor deep-link tokens verified by
///     <c>GET /v1/notifications/exec-digest/sponsor-view</c> (TB-2196).
/// </summary>
public interface IExecDigestSponsorDeepLinkTokenFactory
{
    string CreateDashboardToken(Guid tenantId, string isoWeekIdempotencyKey);

    string CreateRunCollateralToken(Guid tenantId, string runIdHex, string isoWeekIdempotencyKey);

    bool TryParse(string token, out ExecDigestSponsorDeepLinkClaims claims);
}
