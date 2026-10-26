namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts webhook hostnames without persisting callback paths or tokens (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridWebhookHostExtractor
{
    public static string? TryExtractHost(string? endpointUrl)
    {
        if (string.IsNullOrWhiteSpace(endpointUrl))
        {
            return null;
        }

        string trimmed = endpointUrl.Trim();

        if (trimmed.Contains('%', StringComparison.Ordinal))
        {
            string decoded = Uri.UnescapeDataString(trimmed);

            if (!string.Equals(decoded, trimmed, StringComparison.Ordinal))
            {
                trimmed = decoded;
            }
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
