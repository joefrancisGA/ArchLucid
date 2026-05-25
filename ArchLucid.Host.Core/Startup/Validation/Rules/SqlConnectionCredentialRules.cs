using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class SqlConnectionCredentialRules
{
    /// <summary>
    ///     In Production, the SQL connection string must not contain an explicit username/password.
    ///     All SQL authentication must use Managed Identity (Active Directory Default or Managed Identity).
    /// </summary>
    public static void Collect(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ArchLucidOptions archLucidOptions,
        List<string> errors)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(archLucidOptions);
        ArgumentNullException.ThrowIfNull(errors);

        if (!environment.IsProduction())
            return;

        string? message = DescribePasswordCredentialIssue(configuration, archLucidOptions);

        if (message is not null)
            errors.Add(message);
    }

    /// <summary>
    ///     Staging may legitimately use SQL auth during early environment setup; log a warning instead of failing startup.
    /// </summary>
    public static void LogStagingWarningsIfPresent(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(logger);

        if (!environment.IsStaging())
            return;

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);
        string? message = DescribePasswordCredentialIssue(configuration, archLucidOptions);

        if (message is null)
            return;

        if (logger.IsEnabled(LogLevel.Warning))
            logger.LogWarning("{Message}", message);
    }

    internal static bool ShouldEnforceServerCertificateTrust(IConfiguration configuration) =>
        ArchLucidConfigurationBridge.ShouldEnforceSqlServerCertificateTrust(configuration);

    internal static string? DescribePasswordCredentialIssue(
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
    {
        if (!ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            return null;

        string? connectionString = configuration.GetConnectionString(ArchLucidConfigurationBridge.PrimarySqlConnectionName);

        if (string.IsNullOrWhiteSpace(connectionString))
            return null;

        SqlConnectionStringBuilder builder = new(connectionString.Trim());

        if (!string.IsNullOrEmpty(builder.Password))
        {
            return "ConnectionStrings:ArchLucid contains a Password. "
                   + "Use Managed Identity (Authentication=Active Directory Default) instead. "
                   + "Remove Password from the connection string and configure Managed Identity per "
                   + "docs/security/MANAGED_IDENTITY_SQL_BLOB.md.";
        }

        if (!string.IsNullOrEmpty(builder.UserID)
            && !connectionString.Contains("Authentication=", StringComparison.OrdinalIgnoreCase))
        {
            return "ConnectionStrings:ArchLucid contains a User ID without Authentication=. "
                   + "Use Managed Identity (Authentication=Active Directory Default) instead. "
                   + "See docs/security/MANAGED_IDENTITY_SQL_BLOB.md.";
        }

        return null;
    }
}
