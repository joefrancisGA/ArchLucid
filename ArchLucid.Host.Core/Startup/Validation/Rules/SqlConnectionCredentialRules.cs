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

        // Staging may use SQL auth during early setup; LogStagingWarningsIfPresent logs instead of failing startup.

        if (environment.IsStaging())
            return;

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration))
            return;

        SqlPasswordCredentialIssueKind? issueKind = DetectPasswordCredentialIssue(configuration, archLucidOptions);

        if (issueKind is not null)
            errors.Add(SqlPasswordCredentialIssueMessages.For(issueKind.Value));
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
        SqlPasswordCredentialIssueKind? issueKind = DetectPasswordCredentialIssue(configuration, archLucidOptions);

        if (issueKind is null)
            return;

        if (logger.IsEnabled(LogLevel.Warning))
        {
            logger.LogWarning("{Message}", SqlPasswordCredentialIssueMessages.For(issueKind.Value));
        }
    }

    internal static bool ShouldEnforceServerCertificateTrust(IConfiguration configuration) =>
        ArchLucidConfigurationBridge.ShouldEnforceSqlServerCertificateTrust(configuration);

    internal static SqlPasswordCredentialIssueKind? DetectPasswordCredentialIssue(
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
            return SqlPasswordCredentialIssueKind.PasswordPresent;

        if (!string.IsNullOrEmpty(builder.UserID)
            && !connectionString.Contains("Authentication=", StringComparison.OrdinalIgnoreCase))
            return SqlPasswordCredentialIssueKind.UserIdWithoutAuthentication;

        return null;
    }

    internal static string? DescribePasswordCredentialIssue(
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
    {
        SqlPasswordCredentialIssueKind? issueKind = DetectPasswordCredentialIssue(configuration, archLucidOptions);

        return issueKind is null ? null : SqlPasswordCredentialIssueMessages.For(issueKind.Value);
    }
}
