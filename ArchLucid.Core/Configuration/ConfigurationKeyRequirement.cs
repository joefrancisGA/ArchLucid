using ArchLucid.Core.Json;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Configuration;

/// <summary>Interprets <see cref="ConfigurationKeyEntry.Requirement"/> for the active environment.</summary>
public static class ConfigurationKeyRequirement
{
    public static bool IsKeyRequired(
        ConfigurationKeyEntry entry,
        IConfiguration configuration,
        string? aspNetCoreEnvironment,
        out string reason)
    {
        if (entry.Requirement != ConfigKeyRequirementKind.None)
            return IsRequiredByKind(
                configuration,
                aspNetCoreEnvironment,
                entry.Requirement,
                out reason);
        reason = "";

        return false;
    }

    public static bool IsKeyRequired(
        ConfigurationKeyEntry entry,
        IConfiguration configuration,
        string? aspNetCoreEnvironment) =>
        IsKeyRequired(entry, configuration, aspNetCoreEnvironment, out _);

    private static bool IsRequiredByKind(
        IConfiguration c,
        string? aspNetCoreEnvironment,
        ConfigKeyRequirementKind kind,
        out string reason)
    {
        reason = "";

        switch (kind)
        {
            case ConfigKeyRequirementKind.None:
                return false;
            case ConfigKeyRequirementKind.WhenDefaultSqlStorage:

                if (!IsDefaultSql(c))
                {
                    return false;
                }

                reason = "Storage is SQL (or unset, defaulting to SQL).";
                return true;
            case ConfigKeyRequirementKind.WhenRealLlmNotEcho:

                if (!IsRealMode(c) || IsEchoClient(c))
                {
                    return false;
                }

                reason = "AgentExecution:Mode is Real and completion client is not Echo.";
                return true;
            case ConfigKeyRequirementKind.WhenApiKeyEnabled:

                if (!IsConfigurationBooleanEnabled(c, "Authentication:ApiKey:Enabled"))
                {
                    return false;
                }

                reason = "API key authentication is enabled.";
                return true;
            case ConfigKeyRequirementKind.WhenOtlpEnabled:

                if (!IsConfigurationBooleanEnabled(c, "Observability:Otlp:Enabled"))
                {
                    return false;
                }

                reason = "OTLP export is enabled.";
                return true;
            case ConfigKeyRequirementKind.WhenProduction:

                if (!IsProduction(aspNetCoreEnvironment, c))
                {
                    return false;
                }

                reason = "Environment is Production.";
                return true;
            case ConfigKeyRequirementKind.WhenAcsEmail:

                if (!string.Equals(
                        c["Email:Provider"]?.Trim(),
                        EmailProviderNames.AzureCommunicationServices,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                reason = "Email:Provider is Azure Communication Services.";
                return true;
            case ConfigKeyRequirementKind.WhenWorkerRole:

                if (!string.Equals(
                        c["Hosting:Role"]?.Trim(),
                        "Worker",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                reason = "Hosting:Role is Worker.";
                return true;
            default:
                return false;
        }
    }

    private static bool IsProduction(string? envFromCaller, IConfiguration c)
    {
        if (IsAspNetCoreProductionEnvironment(envFromCaller, c))
            return true;

        return IsArchLucidProductionEnvironment(c);
    }

    private static bool IsAspNetCoreProductionEnvironment(string? envFromCaller, IConfiguration c)
    {
        string? env = envFromCaller?.Trim();

        if (string.IsNullOrEmpty(env))
        {
            env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        }

        if (string.IsNullOrEmpty(env))
        {
            env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");
        }

        if (string.IsNullOrEmpty(env))
        {
            env = c["ASPNETCORE_ENVIRONMENT"] ?? c["DOTNET_ENVIRONMENT"] ?? c["Environment"];
        }

        if (string.IsNullOrWhiteSpace(env))
            return false;

        return string.Equals(env.Trim(), "Production", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsArchLucidProductionEnvironment(IConfiguration c)
    {
        string? archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            archLucidEnv = c["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            return false;

        return string.Equals(archLucidEnv.Trim(), "Production", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDefaultSql(IConfiguration c)
    {
        string? s = c["ArchLucid:StorageProvider"]?.Trim();

        return string.IsNullOrEmpty(s) || string.Equals(s, "Sql", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsRealMode(IConfiguration c) =>
        string.Equals(
            c["AgentExecution:Mode"]?.Trim(),
            "Real",
            StringComparison.OrdinalIgnoreCase);

    private static bool IsEchoClient(IConfiguration c) =>
        string.Equals(
            c["AgentExecution:CompletionClient"]?.Trim(),
            "Echo",
            StringComparison.OrdinalIgnoreCase);

    private static bool IsConfigurationBooleanEnabled(IConfiguration configuration, string key)
    {
        if (JsonBooleanStringReader.TryParseBooleanString(configuration[key], out bool parsed))
            return parsed;

        return false;
    }
}
