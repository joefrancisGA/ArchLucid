using ArchLucid.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class AgentExecutionRules
{
    /// <summary>
    ///     After startup validation passes, emits a single INFO when <c>AgentExecution:Mode=Real</c> and Azure OpenAI
    ///     credentials are present (operator confirmation for the first-real-value Docker overlay path).
    /// </summary>
    public static void LogInformationWhenRealModeConfigured(IConfiguration configuration, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(logger);

        string? agentMode = configuration["AgentExecution:Mode"];

        if (!string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase))
            return;

        string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();

        if (string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase))
            return;

        if (!AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration))
            return;

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation(
                "AgentExecution:Mode is Real and Azure OpenAI settings (Endpoint, DeploymentName, and ApiKey or ManagedIdentity) are configured.");
    }

    public static void Collect(IConfiguration configuration, List<string> errors)
    {
        string? agentMode = configuration["AgentExecution:Mode"];

        if (!string.IsNullOrWhiteSpace(agentMode) &&
            !string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase))

            errors.Add("AgentExecution:Mode must be either 'Simulator' or 'Real'.");

        if (!string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase))
            return;

        string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();
        bool useEchoClient = string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrEmpty(completionClient) &&
            !useEchoClient &&
            !string.Equals(completionClient, "AzureOpenAi", StringComparison.OrdinalIgnoreCase))

            errors.Add(
                "AgentExecution:CompletionClient must be 'Echo', 'AzureOpenAi', or omitted (defaults to Azure OpenAI when keys are present). Additional values may be introduced for other ILlmProvider adapters without changing agent code.");

        if (useEchoClient)
            return;

        if (!AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration))

            errors.Add(
                "AgentExecution:Mode is 'Real' but Azure OpenAI is not fully configured. Set environment variables " +
                "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT_NAME with AZURE_OPENAI_API_KEY or " +
                "AzureOpenAI:AuthenticationMode=ManagedIdentity (or the matching AzureOpenAI:Endpoint, " +
                "AzureOpenAI:DeploymentName, and AzureOpenAI:ApiKey / AuthenticationMode configuration keys).");

        int maxCompletionTokens = configuration.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

        if (maxCompletionTokens is < 0 or > 262_144)

            errors.Add(
                "AzureOpenAI:MaxCompletionTokens must be between 1 and 262144 inclusive, or 0 / omitted to use the built-in default (4096).");
    }
}
