using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static partial class ValidateConfigEvaluator
{
    private const string ArchLucidAuthPrefix = "ArchLucidAuth";

    internal static IReadOnlyList<ValidateConfigFinding> Evaluate(
        IConfiguration configuration,
        string contentRoot,
        bool appsettingsExists)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        ArgumentException.ThrowIfNullOrEmpty(contentRoot);

        List<ValidateConfigFinding> findings = [];

        AppendEnvironmentFacts(findings, configuration, contentRoot, appsettingsExists);

        AppendStorageRules(findings, configuration);

        AppendAgentExecutionRules(findings, configuration);

        AppendEntraJwtRules(findings, configuration);

        AppendApiKeyRules(findings, configuration);

        AppendAzureOpenAiRules(findings, configuration);

        return findings.AsReadOnly();
    }

    private static void AppendEnvironmentFacts(
        List<ValidateConfigFinding> findings,
        IConfiguration configuration,
        string contentRoot,
        bool appsettingsExists)
    {
        string effectiveEnv =
            configuration["ASPNETCORE_ENVIRONMENT"]?.Trim()
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "(unset — treated as Production for appsettings overlay)";

        findings.Add(new ValidateConfigFinding(
            ValidateConfigFindingSeverity.Info,
            "Bootstrap",
            "Content root",
            Path.GetFullPath(contentRoot)));

        findings.Add(new ValidateConfigFinding(
            ValidateConfigFindingSeverity.Info,
            "Bootstrap",
            "Hosting environment key",
            effectiveEnv));

        if (appsettingsExists)

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Bootstrap",
                "appsettings.json",
                "Present on disk."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Warning,
                "Bootstrap",
                "appsettings.json",
                "Not found — only environment variables / other layers apply."));
    }

    private static bool LooksLikeSqlServerConnectionString(string connectionString)
    {
        return connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase)
               || connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryCreateHttpsUri(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out Uri? parsed))
            return false;

        return parsed.Scheme == Uri.UriSchemeHttps;
    }

    private static bool IsWellKnownAuthMode(string mode) =>
        string.Equals(mode, "ApiKey", StringComparison.OrdinalIgnoreCase)
        || string.Equals(mode, "JwtBearer", StringComparison.OrdinalIgnoreCase)
        || string.Equals(mode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase);
}
