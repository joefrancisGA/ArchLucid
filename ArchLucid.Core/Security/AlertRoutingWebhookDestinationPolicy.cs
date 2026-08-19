namespace ArchLucid.Core.Security;

/// <summary>SSRF guard for outbound alert-routing webhook destinations — HTTPS only, no loopback/link-local/private targets.</summary>
public static class AlertRoutingWebhookDestinationPolicy
{
    /// <summary>Returns a problem detail when <paramref name="rawUrl" /> is empty or not permitted.</summary>
    public static string? TryGetRejectionReason(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return "Webhook URL is required.";

        if (!Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out Uri? uri))
            return "Webhook URL must be an absolute HTTPS URL.";

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return "Webhook URL must use the https scheme.";

        if (EmbeddedCredentialUrlGuard.HasEmbeddedCredentials(uri))
            return "Webhook URL must not include embedded credentials.";

        return PrivateNetworkAddressGuard.IsForbiddenHostLiteral(uri.IdnHost)
            ? "Webhook URL must not target loopback, link-local, or private network addresses."
            : null;
    }
}
