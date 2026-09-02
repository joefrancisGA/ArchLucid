using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Resilience;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using Microsoft.Extensions.Options;
using Polly;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class AgentCompletionResolutionHelper
{
    internal static int ResolveLlmMaxRetryAttempts(
        AzureOpenAiOptions azureOpenAiOptions,
        AgentExecutionResilienceOptions resOpts)
    {
        ArgumentNullException.ThrowIfNull(azureOpenAiOptions);
        ArgumentNullException.ThrowIfNull(resOpts);

        if (azureOpenAiOptions.MaxRetries > 0)
            return azureOpenAiOptions.MaxRetries;

        return resOpts.LlmCallMaxRetryAttempts;
    }

    internal static BinaryData? ResolveStructuredOutputAgentResultSchema(
        IConfiguration configuration,
        AzureOpenAiOptions azureOpenAiOptions)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(azureOpenAiOptions);

        if (!azureOpenAiOptions.UseJsonSchemaResponseFormat)
            return null;

        SchemaValidationOptions parsed =
            configuration.GetSection(SchemaValidationOptions.SectionName).Get<SchemaValidationOptions>()
            ?? new SchemaValidationOptions();

        string relative = parsed.AgentResultSchemaPath.Trim();

        if (string.IsNullOrEmpty(relative))
            relative = new SchemaValidationOptions().AgentResultSchemaPath;

        string fullPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, relative));

        if (!File.Exists(fullPath))
            throw new InvalidOperationException(
                "AzureOpenAI:UseJsonSchemaResponseFormat is true but the agent result schema file was not found on disk at '"
                + fullPath + "' (SchemaValidation:AgentResultSchemaPath is '" + relative + "').");

        return BinaryData.FromString(File.ReadAllText(fullPath));
    }
}
