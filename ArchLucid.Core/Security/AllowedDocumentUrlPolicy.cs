namespace ArchLucid.Core.Security;

/// <summary>
/// SSRF guard for optional external document URLs — HTTPS only, no loopback/link-local/private (RFC 1918) targets.
/// </summary>
public static class AllowedDocumentUrlPolicy
{
    /// <summary>Returns a problem detail when <paramref name="rawUrl" /> is non-empty and not permitted.</summary>
    public static string? TryGetRejectionReason(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return null;

        if (!Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out Uri? uri))
            return "SourceDocumentUrl must be an absolute HTTPS URL.";

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return "SourceDocumentUrl must use the https scheme.";

        return PrivateNetworkAddressGuard.IsForbiddenHostLiteral(uri.IdnHost)
            ? "SourceDocumentUrl must not target loopback, link-local, or private network addresses."
            : null;
    }
}
