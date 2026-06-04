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

        if (PrivateNetworkAddressGuard.IsForbiddenHostLiteral(uri.IdnHost))
            return "DestinationSasUrl must not target loopback, link-local, or private network addresses.";

        if (!IsAzureBlobStorageHost(uri.IdnHost))
        {
            return "DestinationSasUrl host must be an Azure Blob Storage endpoint "
                   + "(for example *.blob.core.windows.net or *.blob.storage.azure.net).";
        }

        return null;
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
