namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts webhook hostnames without persisting callback paths or tokens (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridWebhookHostExtractor
{
    private const int MaxEndpointUrlPercentDecodePasses = 8;

    public static string? TryExtractHost(string? endpointUrl)
    {
        if (string.IsNullOrWhiteSpace(endpointUrl))
        {
            return null;
        }

        string trimmed = endpointUrl.Trim();

        for (int pass = 0; pass < MaxEndpointUrlPercentDecodePasses && trimmed.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(trimmed);

            if (string.Equals(decoded, trimmed, StringComparison.Ordinal))
            {
                break;
            }

            trimmed = decoded;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri)
            && !trimmed.Contains("://", StringComparison.Ordinal)
            && trimmed.Contains('.', StringComparison.Ordinal)
            && Uri.TryCreate("https://" + trimmed, UriKind.Absolute, out uri))
        {
        }
        else if (uri is null)
        {
            return null;
        }

        string host = uri.Host.Trim().ToLowerInvariant();

        if (host.Length > 0 && host[^1] == '.')
        {
            host = host.TrimEnd('.');
        }

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        return host;
    }
}
