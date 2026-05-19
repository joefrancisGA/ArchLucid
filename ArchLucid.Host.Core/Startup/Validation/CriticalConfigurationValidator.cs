using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation;

/// <summary>
///     Fail-fast checks for connection string and Azure OpenAI settings required before the host accepts work.
/// </summary>
public static class CriticalConfigurationValidator
{
    /// <summary>
    ///     Returns human-readable errors for missing critical configuration. An empty list means validation passed.
    /// </summary>
    public static IReadOnlyList<string> CollectErrors(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        List<string> errors = [];

        CollectConnectionStringErrors(configuration, errors);
        CollectAzureOpenAiErrorsWhenNotSimulator(configuration, errors);

        return errors;
    }

    private static void CollectConnectionStringErrors(IConfiguration configuration, List<string> errors)
    {
        string? connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration);

        if (!string.IsNullOrWhiteSpace(connectionString))
            return;

        errors.Add(
            "ConnectionStrings:ArchLucid is missing or blank. "
            + "Set ConnectionStrings:ArchLucid in appsettings or the ConnectionStrings__ArchLucid environment variable "
            + "to a valid SQL Server connection string before starting the host.");
    }

    private static void CollectAzureOpenAiErrorsWhenNotSimulator(IConfiguration configuration, List<string> errors)
    {
        string? agentMode = configuration["AgentExecution:Mode"]?.Trim();
        bool isSimulator = string.IsNullOrWhiteSpace(agentMode)
            || string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase);

        if (isSimulator)
            return;

        string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();
        bool useEchoClient = string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase);

        if (useEchoClient)
            return;

        List<string> missingAzureOpenAiKeys = [];

        if (string.IsNullOrWhiteSpace(configuration["AzureOpenAI:Endpoint"]))
            missingAzureOpenAiKeys.Add("AzureOpenAI:Endpoint (or AZURE_OPENAI_ENDPOINT)");

        if (string.IsNullOrWhiteSpace(configuration["AzureOpenAI:ApiKey"]))
            missingAzureOpenAiKeys.Add("AzureOpenAI:ApiKey (or AZURE_OPENAI_API_KEY)");

        if (string.IsNullOrWhiteSpace(configuration["AzureOpenAI:DeploymentName"]))
            missingAzureOpenAiKeys.Add("AzureOpenAI:DeploymentName (or AZURE_OPENAI_DEPLOYMENT_NAME)");

        if (missingAzureOpenAiKeys.Count == 0)
            return;

        string modeLabel = string.IsNullOrWhiteSpace(agentMode) ? "(unset)" : agentMode;
        string missingList = string.Join(", ", missingAzureOpenAiKeys);

        errors.Add(
            $"AgentExecution:Mode is '{modeLabel}' (not Simulator) but Azure OpenAI is incomplete. "
            + $"Configure: {missingList}. "
            + "Use AgentExecution:Mode=Simulator for local development without Azure OpenAI, "
            + "or AgentExecution:CompletionClient=Echo when Real mode should use the in-process Echo client.");
    }
}
