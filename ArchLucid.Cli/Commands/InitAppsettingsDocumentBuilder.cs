using System.Globalization;

using Microsoft.Data.SqlClient;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ArchLucid.Cli.Commands;

/// <summary>Builds merged appsettings JSON for <see cref="InitCommand" /> (unit-tested without console I/O).</summary>
public static class InitAppsettingsDocumentBuilder
{
    /// <summary>Formats JSON matching typical ArchLucid Api host sections for SQL + auth startup.</summary>
    public static string BuildIndentedJson(InitWizardAnswers answers)
    {
        ArgumentNullException.ThrowIfNull(answers);

        if (string.IsNullOrWhiteSpace(answers.ConnectionStringsArchLucid))
            throw new ArgumentException("ConnectionStrings:ArchLucid is required.", nameof(answers));

        JObject root = new()
        {
            ["Hosting"] = new JObject { ["Role"] = "Combined" },
            ["ArchLucid"] = new JObject { ["StorageProvider"] = "Sql" },
            ["ConnectionStrings"] = new JObject { ["ArchLucid"] = answers.ConnectionStringsArchLucid.Trim() },
            ["AgentExecution"] = new JObject { ["Mode"] = "Simulator" },
            ["Serilog"] = new JObject
            {
                ["MinimumLevel"] = new JObject
                {
                    ["Default"] = "Information",
                    ["Override"] = new JObject { ["Microsoft.AspNetCore"] = "Warning" },
                },
                ["WriteTo"] = new JArray(new JObject { ["Name"] = "Console" }),
            },
            ["Cors"] = new JObject { ["AllowedOrigins"] = new JArray("http://localhost:3000") },
        };

        switch (answers.AuthKind)
        {
            case InitAuthWizardKind.JwtBearer:
                if (string.IsNullOrWhiteSpace(answers.JwtAuthority))
                    throw new ArgumentException("Entra authority URL is required for JwtBearer.", nameof(answers));

                if (string.IsNullOrWhiteSpace(answers.JwtAudience))
                    throw new ArgumentException("API audience is required for JwtBearer.", nameof(answers));

                root["ArchLucidAuth"] = new JObject
                {
                    ["Mode"] = "JwtBearer",
                    ["Authority"] = answers.JwtAuthority.Trim(),
                    ["Audience"] = answers.JwtAudience.Trim(),
                    ["NameClaimType"] = string.IsNullOrWhiteSpace(answers.JwtNameClaimType)
                        ? "preferred_username"
                        : answers.JwtNameClaimType.Trim(),
                };

                root["Authentication"] = new JObject
                {
                    ["ApiKey"] = new JObject
                    {
                        ["Enabled"] = false,
                        ["DevelopmentBypassAll"] = false,
                        ["AdminKey"] = null,
                        ["ReadOnlyKey"] = null,
                    },
                };

                break;

            case InitAuthWizardKind.ApiKey:
                if (string.IsNullOrWhiteSpace(answers.ApiAdminKey))
                    throw new ArgumentException("Admin API key is required for ApiKey mode.", nameof(answers));

                root["ArchLucidAuth"] = new JObject
                {
                    ["Mode"] = "ApiKey",
                    ["Authority"] = "",
                    ["Audience"] = "",
                    ["DevUserId"] = answers.DevUserId.Trim(),
                    ["DevUserName"] = answers.DevUserName.Trim(),
                    ["DevRole"] = answers.DevRole.Trim(),
                };

                root["Authentication"] = new JObject
                {
                    ["ApiKey"] = new JObject
                    {
                        ["Enabled"] = true,
                        ["DevelopmentBypassAll"] = false,
                        ["AdminKey"] = answers.ApiAdminKey,
                        ["ReadOnlyKey"] = null,
                    },
                };

                break;

            case InitAuthWizardKind.DevelopmentBypass:
                root["ArchLucidAuth"] = new JObject
                {
                    ["Mode"] = "DevelopmentBypass",
                    ["DevUserId"] = answers.DevUserId.Trim(),
                    ["DevUserName"] = answers.DevUserName.Trim(),
                    ["DevRole"] = answers.DevRole.Trim(),
                };

                root["Authentication"] = new JObject
                {
                    ["ApiKey"] = new JObject { ["DevelopmentBypassAll"] = false },
                };

                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(answers), answers.AuthKind, null);
        }

        return root.ToString(Formatting.Indented) + Environment.NewLine;
    }

    /// <summary>Parses SQL connection string enough for builder validation (throws on invalid).</summary>
    public static void ValidateSqlConnectionString(string raw)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(raw);

        _ = new SqlConnectionStringBuilder(raw.Trim());
    }

    /// <summary>Human-readable SQL endpoint summary for confirmation tables (no passwords).</summary>
    public static string DescribeSqlConnection(string raw)
    {
        SqlConnectionStringBuilder builder = new(raw.Trim());

        string dataSource = builder.DataSource.Trim().Length > 0 ? builder.DataSource : "(unknown server)";
        string catalog = builder.InitialCatalog.Trim().Length > 0 ? builder.InitialCatalog : "(default catalog)";

        return string.Format(CultureInfo.InvariantCulture, "Server={0}; Database={1}", dataSource, catalog);
    }
}
