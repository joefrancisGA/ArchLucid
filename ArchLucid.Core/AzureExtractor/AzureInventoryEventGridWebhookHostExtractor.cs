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

        if (!Uri.TryCreate(endpointUrl.Trim(), UriKind.Absolute, out Uri? uri))
        {
            return null;
        }

        string host = uri.Host.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        return host;
    }
}
