namespace ArchLucid.Core.Configuration;

/// <summary>
///     Normalizes Azure OpenAI endpoint URLs for <see cref="Azure.AI.OpenAI.AzureOpenAIClient" /> chat completions.
/// </summary>
public static class AzureOpenAiEndpointNormalizer
{
    /// <summary>
    ///     Maps Azure AI Foundry project URLs (e.g. <c>*.services.ai.azure.com/api/projects/…</c>) to the classic
    ///     <c>https://{resource}.openai.azure.com/</c> shape expected by the in-repo SDK client.
    /// </summary>
    public static string NormalizeForChatCompletions(string endpoint)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);

        string trimmed = endpoint.Trim();
        trimmed = EnsureHttpsSchemeForAzureOpenAiHosts(trimmed);
        trimmed = EnsureHttpsSchemeWhenMissing(trimmed);

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri))
            return EnsureTrailingSlash(trimmed);

        if (uri.Host.EndsWith(".services.ai.azure.com", StringComparison.OrdinalIgnoreCase))
        {
            string resourceName = uri.Host.Split('.')[0];

            if (!string.IsNullOrWhiteSpace(resourceName))
                return $"https://{resourceName}.openai.azure.com/";
        }

        if (uri.Host.EndsWith(".openai.azure.com", StringComparison.OrdinalIgnoreCase))
            return EnsureTrailingSlash(uri.GetLeftPart(UriPartial.Authority) + "/");

        return EnsureTrailingSlash(trimmed);
    }

    private static string EnsureHttpsSchemeForAzureOpenAiHosts(string value)
    {
        if (!value.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            return value;

        if (!TryGetEndpointHost(value, out string? host) || string.IsNullOrEmpty(host) || !IsAzureOpenAiHost(host))
            return value;

        return "https://" + value["http://".Length..];
    }

    private static string EnsureHttpsSchemeWhenMissing(string value)
    {
        if (value.Contains("://", StringComparison.Ordinal))
            return value;

        if (!TryGetEndpointHost(value, out string? host) || string.IsNullOrEmpty(host) || !IsAzureOpenAiHost(host))
            return value;

        return "https://" + value;
    }

    private static bool TryGetEndpointHost(string value, out string? host)
    {
        host = null;

        if (Uri.TryCreate(value, UriKind.Absolute, out Uri? absolute))
        {
            host = absolute.Host;

            return true;
        }

        if (value.Contains("://", StringComparison.Ordinal))
            return false;

        if (!Uri.TryCreate("https://" + value, UriKind.Absolute, out Uri? inferred))
            return false;

        host = inferred.Host;

        return true;
    }

    private static bool IsAzureOpenAiHost(string host) =>
        host.EndsWith(".openai.azure.com", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith(".cognitiveservices.azure.com", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith(".services.ai.azure.com", StringComparison.OrdinalIgnoreCase);

    private static string EnsureTrailingSlash(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? uri))
            return value.EndsWith("/", StringComparison.Ordinal) ? value : value + "/";

        if (!string.IsNullOrEmpty(uri.Query))
        {
            string path = uri.AbsolutePath;

            if (path.Length == 0 || !path.EndsWith("/", StringComparison.Ordinal))
                path += "/";

            return uri.GetLeftPart(UriPartial.Authority) + path + uri.Query;
        }

        if (!string.IsNullOrEmpty(uri.AbsolutePath)
            && !uri.AbsolutePath.EndsWith("/", StringComparison.Ordinal))
        {
            return uri.GetLeftPart(UriPartial.Authority) + uri.AbsolutePath + "/";
        }

        return value.EndsWith("/", StringComparison.Ordinal) ? value : value + "/";
    }
}
