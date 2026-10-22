using System.Globalization;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Diagnostics;

internal static class DoctorQuickStartReadiness
{
    internal static async Task WriteSectionAsync(
        TextWriter output,
        IConfiguration configuration,
        CancellationToken cancellationToken,
        DoctorQuickStartReadinessHooks? hooks = null)
    {
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(configuration);

        await output.WriteLineAsync("--- Quick-start readiness (local configuration) ---");
        await output.WriteLineAsync(
            "Merged appsettings*.json in the current directory + environment — align with the API host process.");
        await output.WriteLineAsync();

        string envName =
            configuration["ASPNETCORE_ENVIRONMENT"]?.Trim()
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")?.Trim()
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")?.Trim()
            ?? "Production";

        bool useSql = UsesDefaultSqlStorage(configuration);
        string? rawConnection = configuration.GetConnectionString("ArchLucid");
        string? securedConnection = null;
        if (!string.IsNullOrWhiteSpace(rawConnection))
        {
            try
            {
                securedConnection = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(rawConnection);
            }
            catch (Exception ex)
            {
                await output.WriteLineAsync(
                    new DoctorReadinessLine(
                        false,
                        "Connection string",
                        "invalid — " + ex.Message
                                     + " (fix ConnectionStrings:ArchLucid / ConnectionStrings__ArchLucid).").Format());

                await WriteRemainingLinesAfterSqlFailureAsync(output, configuration, envName, cancellationToken, hooks)
                    .ConfigureAwait(false);

                return;
            }
        }

        (DoctorReadinessLine connectionLine, DoctorReadinessLine schemaLine) = hooks?.SqlAsync is { } customSql
            ? await customSql(securedConnection, useSql, cancellationToken).ConfigureAwait(false)
            : await DoctorQuickStartHealthProbe.ProbeSqlAsync(securedConnection, useSql, cancellationToken).ConfigureAwait(false);

        await output.WriteLineAsync(connectionLine.Format());

        await output.WriteLineAsync(schemaLine.Format());

        await output.WriteLineAsync(EvaluateAuthMode(configuration, envName).Format());

        DoctorReadinessLine openAiLine = hooks?.OpenAiAsync is { } customOpenAi
            ? await customOpenAi(configuration, cancellationToken).ConfigureAwait(false)
            : await DoctorQuickStartHealthProbe.ProbeOpenAiAsync(configuration, cancellationToken).ConfigureAwait(false);

        await output.WriteLineAsync(openAiLine.Format());

        await output.WriteLineAsync(EvaluateRequiredConfigurationKeys(configuration, envName).Format());

        await output.WriteLineAsync();
    }

    /// <summary>For unit tests: auth row only (mirrors <c>ConfigLintCommand</c> traps).</summary>
    internal static DoctorReadinessLine EvaluateAuthMode(IConfiguration configuration, string? resolvedEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string env = resolvedEnvironmentName?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(env))
        {
            env =
                configuration["ASPNETCORE_ENVIRONMENT"]?.Trim()
                ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")?.Trim()
                ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")?.Trim()
                ?? "Production";
        }

        string modeTrim = configuration["ArchLucidAuth:Mode"]?.Trim() ?? string.Empty;
        string displayMode =
            string.IsNullOrEmpty(modeTrim) ? "(unspecified — host uses DevelopmentBypass registration)" : modeTrim;

        IReadOnlyList<string> authErrors = DescribeAuthMisconfigurations(configuration, env);

        if (authErrors.Count > 0)
        {
            return new DoctorReadinessLine(
                false,
                "Auth mode",
                $"{displayMode} — {authErrors[0]}");
        }

        return new DoctorReadinessLine(
            true,
            "Auth mode",
            $"{displayMode} (valid for {env})");
    }

    /// <summary>Whether to probe Azure OpenAI network reachability (Real mode, non-Echo).</summary>
    internal static bool ShouldProbeOpenAiEndpoint(IConfiguration configuration) =>
        AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(configuration);

    internal static DoctorReadinessLine EvaluateRequiredConfigurationKeys(
        IConfiguration configuration,
        string? aspNetCoreEnvironmentForRequirements)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        List<ConfigurationKeyEntry> catalog = ConfigurationKeyCatalog.All
            .Concat(ConfigurationKeyCatalog.CliLocalOnly)
            .ToList();

        List<string> missing = [];
        foreach (ConfigurationKeyEntry entry in catalog)
        {
            if (!ConfigurationKeyRequirement.IsKeyRequired(entry, configuration, aspNetCoreEnvironmentForRequirements))
                continue;

            if (ConfigurationKeyPresence.IsValuePresent(configuration, entry.ConfigPath))
                continue;

            missing.Add(entry.ConfigPath);
        }

        bool apiKeyOn = configuration.GetValue("Authentication:ApiKey:Enabled", false);

        if (apiKeyOn
            && !ConfigurationKeyPresence.IsValuePresent(configuration, "Authentication:ApiKey:AdminKey")
            && !ConfigurationKeyPresence.IsValuePresent(configuration, "Authentication:ApiKey:ReadOnlyKey"))
            missing.Add("Authentication:ApiKey:AdminKey|ReadOnlyKey (at least one when ApiKey auth is enabled)");

        if (missing.Count == 0)
        {
            return new DoctorReadinessLine(
                true,
                "Required config keys",
                "all conditional requirements from ConfigurationKeyCatalog are satisfied");
        }

        return new DoctorReadinessLine(
            false,
            "Required config keys",
            "missing: " + string.Join("; ", missing.Distinct(StringComparer.OrdinalIgnoreCase))
            + " (see docs/library/CONFIGURATION_REFERENCE.md)");
    }

    private static bool UsesDefaultSqlStorage(IConfiguration configuration)
    {
        string? s = configuration["ArchLucid:StorageProvider"]?.Trim();

        return string.IsNullOrEmpty(s) || string.Equals(s, "Sql", StringComparison.OrdinalIgnoreCase);
    }

    private static List<string> DescribeAuthMisconfigurations(IConfiguration cfg, string hostingEnvironmentName)
    {
        List<string> errors = [];
        bool isDevelopment = hostingEnvironmentName.Equals(
            Environments.Development,
            StringComparison.OrdinalIgnoreCase);

        string? archLucidEnv = ReadArchLucidEnvironment(cfg);

        bool envImpliesProductionLike =
            HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(hostingEnvironmentName)
            || HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(archLucidEnv ?? string.Empty);

        bool nonDevelopmentHosting = !isDevelopment || envImpliesProductionLike;

        bool lintFailFast =
            ProductionDangerousMisconfigurationLint.AppliesDangerousFailFast(hostingEnvironmentName, cfg);

        if (!lintFailFast
            && nonDevelopmentHosting
            && string.Equals(
                cfg["ArchLucidAuth:Mode"]?.Trim(),
                "DevelopmentBypass",
                StringComparison.OrdinalIgnoreCase))
            errors.Add(
                "DevelopmentBypass is not allowed outside Development — set ArchLucidAuth:Mode to ApiKey or JwtBearer.");

        if (!lintFailFast
            && nonDevelopmentHosting
            && cfg.GetValue("Authentication:ApiKey:DevelopmentBypassAll", false))
            errors.Add(
                "Authentication:ApiKey:DevelopmentBypassAll must be false outside Development (see AuthSafetyGuard).");

        if (nonDevelopmentHosting && string.IsNullOrWhiteSpace(cfg["ArchLucidAuth:Mode"]?.Trim()))
        {
            errors.Add(
                "ArchLucidAuth:Mode must be JwtBearer or ApiKey outside Development (omitted mode registers DevelopmentBypass).");

            return errors;
        }

        if (string.IsNullOrWhiteSpace(cfg["ArchLucidAuth:Mode"]?.Trim()))
            return errors;

        string modeTrim = cfg["ArchLucidAuth:Mode"]!.Trim();

        if (!nonDevelopmentHosting)
            return errors;

        bool jwt = string.Equals(modeTrim, "JwtBearer", StringComparison.OrdinalIgnoreCase);

        bool apiKey = string.Equals(modeTrim, "ApiKey", StringComparison.OrdinalIgnoreCase);

        if (!jwt && !apiKey)
            errors.Add("ArchLucidAuth:Mode must be JwtBearer or ApiKey for production-like hosting.");

        return errors;
    }

    private static string? ReadArchLucidEnvironment(IConfiguration configuration)
    {
        string? archLucidEnv = configuration["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        return archLucidEnv;
    }

    private static async Task WriteRemainingLinesAfterSqlFailureAsync(
        TextWriter output,
        IConfiguration configuration,
        string? envName,
        CancellationToken cancellationToken,
        DoctorQuickStartReadinessHooks? hooks)
    {
        await output.WriteLineAsync(
            new DoctorReadinessLine(
                false,
                "Storage / schema",
                "skipped — fix connection string first").Format());

        await output.WriteLineAsync(EvaluateAuthMode(configuration, envName).Format());

        DoctorReadinessLine openAiLine = hooks?.OpenAiAsync is { } customOpenAi
            ? await customOpenAi(configuration, cancellationToken).ConfigureAwait(false)
            : await DoctorQuickStartHealthProbe.ProbeOpenAiAsync(configuration, cancellationToken).ConfigureAwait(false);

        await output.WriteLineAsync(openAiLine.Format());

        await output.WriteLineAsync(EvaluateRequiredConfigurationKeys(configuration, envName).Format());

        await output.WriteLineAsync();
    }
}
