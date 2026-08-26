using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static partial class ValidateConfigEvaluator
{
    private static void AppendStorageRules(List<ValidateConfigFinding> findings, IConfiguration configuration)
    {
        string? storageRaw = configuration["ArchLucid:StorageProvider"]?.Trim();

        if (string.IsNullOrWhiteSpace(storageRaw))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Database",
                "ArchLucid:StorageProvider",
                "Unset defaults to Sql (product rule)."));

        else if (!string.Equals(storageRaw, "Sql", StringComparison.OrdinalIgnoreCase)
                 && !string.Equals(storageRaw, "InMemory", StringComparison.OrdinalIgnoreCase))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Database",
                "ArchLucid:StorageProvider",
                "Must be Sql or InMemory when set."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Database",
                "ArchLucid:StorageProvider",
                $"{storageRaw} — storage mode recognized."));

        bool storageSql = string.IsNullOrWhiteSpace(storageRaw)
                          || string.Equals(storageRaw, "Sql", StringComparison.OrdinalIgnoreCase);

        if (!storageSql)
        {
            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Database",
                "ConnectionStrings:ArchLucid",
                "Not required when ArchLucid:StorageProvider is InMemory."));

            return;
        }

        string? cs = configuration.GetConnectionString("ArchLucid");

        if (string.IsNullOrWhiteSpace(cs))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Database",
                "ConnectionStrings:ArchLucid",
                "Required for Sql storage (use ConnectionStrings__ArchLucid env or appsettings)."));

        else
        {
            if (LooksLikeSqlServerConnectionString(cs))

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Ok,
                    "Database",
                    "ConnectionStrings:ArchLucid",
                    "Present (value not shown). Recognized SQL Server-style keys."));

            else

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Warning,
                    "Database",
                    "ConnectionStrings:ArchLucid",
                    "Present but does not look like a typical SQL Server connection string (check Server= or Data Source=)."));
        }
    }

    private static void AppendAgentExecutionRules(List<ValidateConfigFinding> findings, IConfiguration configuration)
    {
        string? agentMode = configuration["AgentExecution:Mode"]?.Trim();

        if (string.IsNullOrWhiteSpace(agentMode))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Warning,
                "AgentExecution",
                "AgentExecution:Mode",
                "Unset — confirm the host default matches your intent (template uses Simulator)."));

        else if (!string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase)
                 && !string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "AgentExecution",
                "AgentExecution:Mode",
                $"Invalid value '{agentMode}' — must be Simulator or Real."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "AgentExecution",
                "AgentExecution:Mode",
                agentMode));

        string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();

        if (string.IsNullOrEmpty(completionClient))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "AgentExecution",
                "AgentExecution:CompletionClient",
                "Omitted — Real mode uses Azure OpenAI when not set to Echo."));

        else
        {
            bool echo = string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase);

            bool azure = string.Equals(completionClient, "AzureOpenAi", StringComparison.OrdinalIgnoreCase);

            if (!echo && !azure)

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Error,
                    "AgentExecution",
                    "AgentExecution:CompletionClient",
                    $"Invalid value '{completionClient}' — must be Echo, AzureOpenAi, or omitted."));

            else

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Ok,
                    "AgentExecution",
                    "AgentExecution:CompletionClient",
                    completionClient));
        }

        int maxCompletionTokens = configuration.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

        if (maxCompletionTokens is < 0 or > 262_144)

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "AzureOpenAI",
                "AzureOpenAI:MaxCompletionTokens",
                "Must be 0 (use default) or between 1 and 262144 inclusive."));

        else if (maxCompletionTokens > 0)

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "AzureOpenAI",
                "AzureOpenAI:MaxCompletionTokens",
                $"Set to {maxCompletionTokens}."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "AzureOpenAI",
                "AzureOpenAI:MaxCompletionTokens",
                "0 / omitted — host uses built-in default (4096)."));
    }
}
