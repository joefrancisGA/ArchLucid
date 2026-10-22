namespace ArchLucid.Application.Notifications.Email;

/// <summary>Creates opaque unsubscribe tokens verified by <c>GET /v1/notifications/sponsor-digest/unsubscribe</c>.</summary>
public interface ISponsorDigestUnsubscribeTokenFactory
{
    string CreateToken(Guid tenantId);

    bool TryParseTenant(string token, out Guid tenantId);
}
