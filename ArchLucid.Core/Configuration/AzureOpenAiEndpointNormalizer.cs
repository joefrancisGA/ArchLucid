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

    private static string EnsureTrailingSlash(string value)
    {
        return value.EndsWith("/", StringComparison.Ordinal) ? value : value + "/";
    }
}
