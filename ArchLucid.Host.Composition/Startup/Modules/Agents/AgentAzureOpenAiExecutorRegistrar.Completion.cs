using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.AzureOpenAI;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentAzureOpenAiExecutorRegistrar
{
    private static void RegisterCompletionClients(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<AzureOpenAiCompletionClientCache>(sp =>
        {
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string endpoint = config["AzureOpenAI:Endpoint"]
                              ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
            string? apiKey = config["AzureOpenAI:ApiKey"];
            string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
            int maxTokens = config.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

            if (maxTokens <= 0)

                maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


            AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
            BinaryData? schema = AgentCompletionPipelineHelpers.ResolveStructuredOutputAgentResultSchema(config, ao);
            ILogger<AzureOpenAiCompletionClient> completionLogger =
                sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
            IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();
            ILlmCompletionOutputTruncationReporter truncationReporter =
                sp.GetRequiredService<ILlmCompletionOutputTruncationReporter>();

            bool useManagedIdentity =
                string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase);

            return new AzureOpenAiCompletionClientCache(deploymentName =>
            {
                if (useManagedIdentity)
                {
                    return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                        endpoint,
                        deploymentName,
                        maxTokens,
                        schema,
                        completionLogger,
                        llmTelemetryOptions,
                        truncationReporter);
                }

                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    throw new InvalidOperationException(
                        "AzureOpenAI:ApiKey is missing while AuthenticationMode is ApiKey.");
                }

                return new AzureOpenAiCompletionClient(
                    endpoint,
                    apiKey,
                    deploymentName,
                    maxTokens,
                    schema,
                    completionLogger,
                    llmTelemetryOptions,
                    truncationReporter);
            });
        });

        services.AddSingleton<AzureOpenAiCompletionClient>(sp =>
        {
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string endpoint = config["AzureOpenAI:Endpoint"]
                              ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
            string? apiKey = config["AzureOpenAI:ApiKey"];
            string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
            string deploymentName = config["AzureOpenAI:DeploymentName"]
                                    ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
            int maxTokens = config.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

            if (maxTokens <= 0)

                maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


            AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
            BinaryData? schema = AgentCompletionPipelineHelpers.ResolveStructuredOutputAgentResultSchema(config, ao);
            ILogger<AzureOpenAiCompletionClient> completionLogger =
                sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
            IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();
            ILlmCompletionOutputTruncationReporter truncationReporter =
                sp.GetRequiredService<ILlmCompletionOutputTruncationReporter>();

            if (string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            {
                return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                    endpoint,
                    deploymentName,
                    maxTokens,
                    schema,
                    completionLogger,
                    llmTelemetryOptions,
                    truncationReporter);
            }

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("AzureOpenAI:ApiKey is missing.");

            return new AzureOpenAiCompletionClient(
                endpoint,
                apiKey,
                deploymentName,
                maxTokens,
                schema,
                completionLogger,
                llmTelemetryOptions,
                truncationReporter);
        });

        services.AddSingleton<LlmTokenQuotaWindowTracker>();
        services.AddScoped<LlmCompletionAccountingTelemetry>();

        services.AddKeyedScoped<IAgentCompletionClient>(
            AgentOutputLlmJudgeCompletionServiceKey.Value,
            static (sp, _) => AgentCompletionPipelineHelpers.BuildAgentOutputSemanticJudgeCompletionChain(sp));
    }
}
