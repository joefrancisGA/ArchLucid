using System.Globalization;
using System.Net;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Diagnostics;

internal static class DoctorQuickStartReadiness
{
    private static readonly HttpClient OpenAiProbeHttpClient = CreateOpenAiProbeHttpClient();

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
            : await DefaultSqlProbeAsync(securedConnection, useSql, cancellationToken).ConfigureAwait(false);

        await output.WriteLineAsync(connectionLine.Format());

        await output.WriteLineAsync(schemaLine.Format());

        await output.WriteLineAsync(EvaluateAuthMode(configuration, envName).Format());

        DoctorReadinessLine openAiLine = hooks?.OpenAiAsync is { } customOpenAi
            ? await customOpenAi(configuration, cancellationToken).ConfigureAwait(false)
            : await DefaultOpenAiLineAsync(configuration, cancellationToken).ConfigureAwait(false);

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
            : await DefaultOpenAiLineAsync(configuration, cancellationToken).ConfigureAwait(false);

        await output.WriteLineAsync(openAiLine.Format());

        await output.WriteLineAsync(EvaluateRequiredConfigurationKeys(configuration, envName).Format());

        await output.WriteLineAsync();
    }

    private static async Task<(DoctorReadinessLine Connection, DoctorReadinessLine Schema)> DefaultSqlProbeAsync(
        string? securedConnection,
        bool useSql,
        CancellationToken cancellationToken)
    {
        if (!useSql)
        {
            return (
                new DoctorReadinessLine(
                    true,
                    "Connection string",
                    "skipped — ArchLucid:StorageProvider is InMemory"),
                new DoctorReadinessLine(
                    true,
                    "Storage / schema",
                    "InMemory (no SQL migrations)"));
        }

        if (string.IsNullOrWhiteSpace(securedConnection))
        {
            return (
                new DoctorReadinessLine(
                    false,
                    "Connection string",
                    "not configured (set ConnectionStrings:ArchLucid or ConnectionStrings__ArchLucid)"),
                new DoctorReadinessLine(
                    false,
                    "Storage / schema",
                    "skipped — configure SQL connection first"));
        }

        try
        {
            await using SqlConnection connection = new(securedConnection);
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            string db = connection.Database;

            (bool tableMissing, int applied, string? latestScript) =
                await ReadSchemaVersionSummaryAsync(connection, cancellationToken).ConfigureAwait(false);

            DoctorReadinessLine schemaLine;
            if (tableMissing)
            {
                schemaLine = new DoctorReadinessLine(
                    false,
                    "Storage / schema",
                    "dbo.SchemaVersions missing — run migrations (start API host or apply DatabaseMigrator)");
            }
            else if (applied == 0)
            {
                schemaLine = new DoctorReadinessLine(
                    false,
                    "Storage / schema",
                    "no migration scripts applied — run migrations (start API host or apply DatabaseMigrator)");
            }
            else
            {
                string latest = ShortMigrationDisplayName(latestScript ?? "(unknown)");
                schemaLine = new DoctorReadinessLine(
                    true,
                    "Storage / schema",
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Sql ({0} migrations applied, latest {1})",
                        applied,
                        latest));
            }

            DoctorReadinessLine connectionLine = new(
                true,
                "Connection string",
                string.Format(CultureInfo.InvariantCulture, "reachable (database {0}, {1} migrations applied)", db, applied));

            return (connectionLine, schemaLine);
        }
        catch (Exception ex) when (ex is SqlException or TimeoutException or InvalidOperationException)
        {
            return (
                new DoctorReadinessLine(
                    false,
                    "Connection string",
                    "not reachable — " + ex.Message
                    + " (verify SQL host, firewall, credentials, Encrypt=Mandatory)"),
                new DoctorReadinessLine(
                    false,
                    "Storage / schema",
                    "skipped — fix SQL connectivity first"));
        }
    }

    private static async Task<(bool TableMissing, int Count, string? LatestScript)> ReadSchemaVersionSummaryAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL
                               SELECT -1 AS Cnt, NULL AS LatestScript;
                           ELSE
                               SELECT COUNT(*) AS Cnt,
                                      (SELECT TOP 1 ScriptName FROM dbo.SchemaVersions ORDER BY Applied DESC) AS LatestScript
                               FROM dbo.SchemaVersions;
                           """;

        await using SqlCommand command = new(sql, connection);
        await using SqlDataReader reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        if (!await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            return (true, 0, null);

        int count = reader.GetInt32(0);

        if (count < 0)
            return (true, 0, null);

        string? latestScript = reader.IsDBNull(1) ? null : reader.GetString(1);
        return (false, count, latestScript);
    }

    private static string ShortMigrationDisplayName(string embeddedResourceName)
    {
        const string token = ".Migrations.";
        int idx = embeddedResourceName.IndexOf(token, StringComparison.OrdinalIgnoreCase);

        return idx < 0 ? embeddedResourceName : embeddedResourceName[(idx + token.Length)..];
    }

    private static async Task<DoctorReadinessLine> DefaultOpenAiLineAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        if (!ShouldProbeOpenAiEndpoint(configuration))
        {
            string mode = configuration["AgentExecution:Mode"]?.Trim() ?? "Simulator";

            return new DoctorReadinessLine(
                true,
                "OpenAI endpoint",
                "skipped (" + mode + " — probe only for AgentExecution:Mode=Real without Echo client)");
        }

        string? endpoint = configuration["AzureOpenAI:Endpoint"]?.Trim();
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return new DoctorReadinessLine(
                false,
                "OpenAI endpoint",
                "not configured (set AzureOpenAI:Endpoint and credentials for Real agent mode)");
        }

        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out Uri? resourceUri))
        {
            return new DoctorReadinessLine(
                false,
                "OpenAI endpoint",
                "invalid URL — check AzureOpenAI:Endpoint");
        }

        Uri probeTarget = new(resourceUri.GetLeftPart(UriPartial.Authority));

        try
        {
            using HttpRequestMessage request = new(HttpMethod.Get, probeTarget);
            request.Headers.TryAddWithoutValidation(
                "api-key",
                configuration["AzureOpenAI:ApiKey"]?.Trim() ?? string.Empty);

            using HttpResponseMessage response = await OpenAiProbeHttpClient
                .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                .ConfigureAwait(false);

            int code = (int)response.StatusCode;

            if (response.StatusCode == HttpStatusCode.OK
                || response.StatusCode == HttpStatusCode.Unauthorized
                || response.StatusCode == HttpStatusCode.Forbidden
                || code == 404)
                return new DoctorReadinessLine(
                    true,
                    "OpenAI endpoint",
                    string.Format(CultureInfo.InvariantCulture, "reachable (HTTP {0} on resource root)", code));

            return new DoctorReadinessLine(
                true,
                "OpenAI endpoint",
                string.Format(
                    CultureInfo.InvariantCulture,
                    "reachable (HTTP {0} — confirm deployment and api-version if calls fail)",
                    code));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return new DoctorReadinessLine(
                false,
                "OpenAI endpoint",
                "not reachable — " + ex.Message + " (verify AzureOpenAI:Endpoint, DNS, and egress)");
        }
    }

    private static HttpClient CreateOpenAiProbeHttpClient()
    {
        SocketsHttpHandler handler = new()
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        };

        return new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(12),
        };
    }
}
