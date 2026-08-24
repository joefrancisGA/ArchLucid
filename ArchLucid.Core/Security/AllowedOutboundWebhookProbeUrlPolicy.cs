namespace ArchLucid.Core.Security;

/// <summary>
///     SSRF guard for operator webhook probe endpoints — HTTPS only, no loopback/link-local/private targets.
/// </summary>
public static class AllowedOutboundWebhookProbeUrlPolicy
{
    /// <summary>Returns a problem detail when <paramref name="rawUrl" /> is not permitted.</summary>
    public static string? TryGetRejectionReason(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return "TargetUrl is required.";

        if (!Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out Uri? uri))
            return "TargetUrl must be an absolute HTTPS URL.";

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return "TargetUrl must use the https scheme.";

        if (EmbeddedCredentialUrlGuard.HasEmbeddedCredentials(uri))
            return "TargetUrl must not include embedded credentials.";

        return PrivateNetworkAddressGuard.IsForbiddenHostLiteral(uri.IdnHost)
            ? "TargetUrl must not target loopback, link-local, or private network addresses."
            : null;
    }

    /// <summary>Literal checks plus post-DNS resolution guard (TB-274 / outbound webhook probe).</summary>
    public static async Task<string?> TryGetRejectionReasonAfterDnsResolveAsync(
        string? rawUrl,
        CancellationToken cancellationToken = default)
    {
        string? syncReason = TryGetRejectionReason(rawUrl);

        if (syncReason is not null)
            return syncReason;

        if (string.IsNullOrWhiteSpace(rawUrl))
            return null;

        string? dnsReason =
            await OutboundHttpsUrlDnsResolutionGuard
                .TryGetRejectionReasonAfterDnsResolveAsync(rawUrl, cancellationToken)
                .ConfigureAwait(false);

        if (dnsReason is null)
            return null;

        return dnsReason.StartsWith("URL ", StringComparison.Ordinal)
            ? "TargetUrl" + dnsReason[3..]
            : dnsReason;
    }
}
