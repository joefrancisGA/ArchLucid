namespace ArchLucid.Core.Security;

/// <summary>
///     SSRF guard for <c>POST /v1/artifacts/runs/{runId}/export/push</c> — HTTPS Azure Blob SAS hosts only (BE-034).
/// </summary>
public static class AllowedRunExportBlobDestinationUrlPolicy
{
    /// <summary>Returns a validation message when <paramref name="rawUrl" /> is not permitted.</summary>
    public static string? TryGetRejectionReason(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return "DestinationSasUrl is required.";

        if (!Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out Uri? uri))
            return "DestinationSasUrl must be an absolute HTTPS URL.";

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return "DestinationSasUrl must use the https scheme.";

        if (EmbeddedCredentialUrlGuard.HasEmbeddedCredentials(uri))
            return "DestinationSasUrl must not include embedded credentials.";

        if (PrivateNetworkAddressGuard.IsForbiddenHostLiteral(uri.IdnHost))
            return "DestinationSasUrl must not target loopback, link-local, or private network addresses.";

        if (!IsAzureBlobStorageHost(uri.IdnHost))
        {
            return "DestinationSasUrl host must be an Azure Blob Storage endpoint "
                   + "(for example *.blob.core.windows.net or *.blob.storage.azure.net).";
        }

        return null;
    }

    /// <summary>Literal/blob-host checks plus post-DNS resolution guard (TB-274 / 5DL).</summary>
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
            ? "DestinationSasUrl" + dnsReason[3..]
            : dnsReason;
    }

    private static bool IsAzureBlobStorageHost(string host)
    {
        if (host.EndsWith(".blob.core.windows.net", StringComparison.OrdinalIgnoreCase))
            return true;

        if (host.EndsWith(".blob.storage.azure.net", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }
}
