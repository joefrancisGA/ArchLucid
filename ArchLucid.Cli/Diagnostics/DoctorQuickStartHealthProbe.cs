using System.Globalization;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Diagnostics;

/// <summary>
///     SQL and OpenAI health probes extracted from <see cref="DoctorQuickStartReadiness" />.
/// </summary>
internal static class DoctorQuickStartHealthProbe
{
    private static readonly HttpClient OpenAiProbeHttpClient =
        CliHttpProbeSession.CreateDetachedProbe(TimeSpan.FromSeconds(12));

    internal static async Task<(DoctorReadinessLine Connection, DoctorReadinessLine Schema)> ProbeSqlAsync(
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

    internal static async Task<DoctorReadinessLine> ProbeOpenAiAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!DoctorQuickStartReadiness.ShouldProbeOpenAiEndpoint(configuration))
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

            if (response.StatusCode == System.Net.HttpStatusCode.OK
                || response.StatusCode == System.Net.HttpStatusCode.Unauthorized
                || response.StatusCode == System.Net.HttpStatusCode.Forbidden
                || code == 404)
            {
                return new DoctorReadinessLine(
                    true,
                    "OpenAI endpoint",
                    string.Format(CultureInfo.InvariantCulture, "reachable (HTTP {0} on resource root)", code));
            }

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
}
