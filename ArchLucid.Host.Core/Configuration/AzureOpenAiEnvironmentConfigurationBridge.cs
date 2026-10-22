using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Configuration;

/// <summary>
///     Maps flat <c>AZURE_OPENAI_*</c> shell variables (CLI / compose host env) onto
///     <see cref="AzureOpenAiOptions" /> keys when the nested settings are unset.
/// </summary>
public static class AzureOpenAiEnvironmentConfigurationBridge
{
    private const string EndpointKey = $"{AzureOpenAiOptions.SectionName}:Endpoint";
    private const string ApiKeyKey = $"{AzureOpenAiOptions.SectionName}:ApiKey";
    private const string DeploymentNameKey = $"{AzureOpenAiOptions.SectionName}:DeploymentName";

    private const string EnvEndpoint = "AZURE_OPENAI_ENDPOINT";
    private const string EnvApiKey = "AZURE_OPENAI_API_KEY";
    private const string EnvDeploymentName = "AZURE_OPENAI_DEPLOYMENT_NAME";

    public static void Apply(IConfiguration configuration)
    {
        if (configuration is not ConfigurationManager editable)
            return;

        List<KeyValuePair<string, string?>> updates = [];

        TryAddAlias(editable, updates, EndpointKey, EnvEndpoint);
        TryAddAlias(editable, updates, ApiKeyKey, EnvApiKey);
        TryAddAlias(editable, updates, DeploymentNameKey, EnvDeploymentName);

        if (updates.Count == 0)
            return;

        editable.AddInMemoryCollection(updates);
    }

    private static void TryAddAlias(
        IConfiguration editable,
        ICollection<KeyValuePair<string, string?>> updates,
        string targetKey,
        string sourceKey)
    {
        if (!string.IsNullOrWhiteSpace(editable[targetKey]?.Trim()))
            return;

        string? alias = editable[sourceKey]?.Trim();

        if (string.IsNullOrWhiteSpace(alias))
            return;

        updates.Add(new KeyValuePair<string, string?>(targetKey, alias));
    }
}
