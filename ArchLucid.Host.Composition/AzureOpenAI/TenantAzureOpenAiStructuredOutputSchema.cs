using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Validation;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Composition.AzureOpenAI;

/// <summary>Shared structured-output schema resolution for managed and BYO Azure OpenAI clients (TB-872).</summary>
internal static class TenantAzureOpenAiStructuredOutputSchema
{
    internal static BinaryData? Resolve(IConfiguration configuration, AzureOpenAiOptions azureOpenAiOptions)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(azureOpenAiOptions);

        if (!azureOpenAiOptions.UseJsonSchemaResponseFormat)
        {
            return null;
        }

        SchemaValidationOptions parsed =
            configuration.GetSection(SchemaValidationOptions.SectionName).Get<SchemaValidationOptions>()
            ?? new SchemaValidationOptions();

        string relative = parsed.AgentResultSchemaPath.Trim();

        if (string.IsNullOrEmpty(relative))
        {
            relative = new SchemaValidationOptions().AgentResultSchemaPath;
        }

        string fullPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, relative));

        if (!File.Exists(fullPath))
        {
            throw new InvalidOperationException(
                "AzureOpenAI:UseJsonSchemaResponseFormat is true but the agent result schema file was not found on disk at '"
                + fullPath + "' (SchemaValidation:AgentResultSchemaPath is '" + relative + "').");
        }

        return BinaryData.FromString(File.ReadAllText(fullPath));
    }
}
