using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Shared Azure OpenAI configuration predicates for host registration and fail-fast validation (TB-080).
/// </summary>
public static class AzureOpenAiConfigurationProbe
{
    /// <summary>
    ///     <see langword="true" /> when <c>AzureOpenAI:AuthenticationMode</c> is <c>ManagedIdentity</c>.
    /// </summary>
    public static bool UsesManagedIdentity(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string authenticationMode = configuration[$"{AzureOpenAiOptions.SectionName}:AuthenticationMode"]?.Trim()
            ?? "ApiKey";

        return string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Completion stack is configured when endpoint and deployment are set and either managed identity or an API key is present.
    /// </summary>
    public static bool IsCompletionStackConfigured(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(configuration[$"{AzureOpenAiOptions.SectionName}:Endpoint"]))
            return false;

        if (string.IsNullOrWhiteSpace(configuration[$"{AzureOpenAiOptions.SectionName}:DeploymentName"]))
            return false;

        if (UsesManagedIdentity(configuration))
            return true;

        return !string.IsNullOrWhiteSpace(configuration[$"{AzureOpenAiOptions.SectionName}:ApiKey"]);
    }

    /// <summary>
    ///     Embeddings are configured when embedding deployment, endpoint, and credential mode requirements are satisfied.
    /// </summary>
    public static bool IsEmbeddingsStackConfigured(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(configuration[$"{AzureOpenAiOptions.SectionName}:EmbeddingDeploymentName"]))
            return false;

        if (string.IsNullOrWhiteSpace(configuration[$"{AzureOpenAiOptions.SectionName}:Endpoint"]))
            return false;

        if (UsesManagedIdentity(configuration))
            return true;

        return !string.IsNullOrWhiteSpace(configuration[$"{AzureOpenAiOptions.SectionName}:ApiKey"]);
    }
}
