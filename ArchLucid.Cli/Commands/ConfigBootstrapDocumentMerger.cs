using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ArchLucid.Cli.Commands;

/// <summary>Merges bootstrap answers into <c>appsettings.Development.json</c> shape (unit-tested).</summary>
public static class ConfigBootstrapDocumentMerger
{
    /// <summary>
    ///     Merges SQL and Azure OpenAI settings into JSON. When <paramref name="existingJson" /> is null or whitespace, starts from an empty object.
    /// </summary>
    public static string MergeToIndentedJson(string? existingJson, ConfigBootstrapAnswers answers)
    {
        ArgumentNullException.ThrowIfNull(answers);

        if (string.IsNullOrWhiteSpace(answers.ConnectionStringsArchLucid))
            throw new ArgumentException("ConnectionStrings:ArchLucid is required.", nameof(answers));

        if (string.IsNullOrWhiteSpace(answers.AzureOpenAiEndpoint))
            throw new ArgumentException("AzureOpenAI:Endpoint is required.", nameof(answers));

        if (string.IsNullOrWhiteSpace(answers.AzureOpenAiApiKey))
            throw new ArgumentException("AzureOpenAI:ApiKey is required.", nameof(answers));

        if (string.IsNullOrWhiteSpace(answers.AzureOpenAiDeploymentName))
            throw new ArgumentException("AzureOpenAI:DeploymentName is required.", nameof(answers));

        InitAppsettingsDocumentBuilder.ValidateSqlConnectionString(answers.ConnectionStringsArchLucid);
        ValidateHttpsResourceEndpoint(answers.AzureOpenAiEndpoint);

        JObject root = string.IsNullOrWhiteSpace(existingJson)
            ? new JObject()
            : JObject.Parse(existingJson);

        JObject connectionStrings = (JObject)(root["ConnectionStrings"] ??= new JObject());
        connectionStrings["ArchLucid"] = answers.ConnectionStringsArchLucid.Trim();

        JObject azureOpenAi = (JObject)(root["AzureOpenAI"] ??= new JObject());
        azureOpenAi["Endpoint"] = answers.AzureOpenAiEndpoint.Trim();
        azureOpenAi["ApiKey"] = answers.AzureOpenAiApiKey.Trim();
        azureOpenAi["DeploymentName"] = answers.AzureOpenAiDeploymentName.Trim();

        return root.ToString(Formatting.Indented) + Environment.NewLine;
    }

    /// <summary>Requires HTTPS absolute URI suitable for Azure OpenAI resource base URL.</summary>
    public static void ValidateHttpsResourceEndpoint(string rawEndpoint)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawEndpoint);

        if (!Uri.TryCreate(rawEndpoint.Trim(), UriKind.Absolute, out Uri? uri))
            throw new ArgumentException("Azure OpenAI endpoint must be an absolute HTTPS URL.", nameof(rawEndpoint));

        if (uri.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("Azure OpenAI endpoint must use HTTPS.", nameof(rawEndpoint));
    }
}
