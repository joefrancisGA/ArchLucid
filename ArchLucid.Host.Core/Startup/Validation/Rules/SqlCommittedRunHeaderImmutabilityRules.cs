using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

/// <summary>
///     Production-like startup probe: committed run header evidence anchors must be protected by
///     <see cref="CommittedRunHeaderAnchorRegistry.TriggerName" /> (migration 250; TB-310).
/// </summary>
internal static class SqlCommittedRunHeaderImmutabilityRules
{
    internal static bool ShouldValidate(
        IHostEnvironment environment,
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
        => SqlAuditImmutabilityRules.ShouldValidate(environment, configuration, archLucidOptions);

    internal static string? ResolveCatalogConnectionString(IConfiguration configuration)
        => SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration);

    internal static void ValidateOrThrow(string rawConnectionString, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(rawConnectionString);
        ArgumentNullException.ThrowIfNull(logger);

        string connectionString =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(rawConnectionString.Trim());

        List<string> errors = [];

        try
        {
            using SqlConnection connection = new(connectionString);
            connection.Open();

            if (!SqlDatabaseImmutabilityProbeHelpers.ObjectExists(connection, CommittedRunHeaderAnchorRegistry.TableName))
            {
                logger.LogInformation(
                    "Startup: committed run header immutability probe skipped ({TableName} not present).",
                    CommittedRunHeaderAnchorRegistry.TableName);

                return;
            }

            if (!SqlDatabaseImmutabilityProbeHelpers.TriggerExists(connection, CommittedRunHeaderAnchorRegistry.TriggerName))
            {
                errors.Add(
                    $"Committed run header immutability: trigger {CommittedRunHeaderAnchorRegistry.TriggerName} on "
                    + $"{CommittedRunHeaderAnchorRegistry.TableName} is missing (migration 250).");
            }
        }
        catch (Exception ex)
        {
            errors.Add($"Committed run header immutability probe failed: {ex.Message}");
        }

        if (errors.Count == 0)
        {
            logger.LogInformation(
                "Startup: committed run header immutability probe passed ({TriggerName}).",
                CommittedRunHeaderAnchorRegistry.TriggerName);

            return;
        }

        throw new InvalidOperationException(
            "Committed run header immutability validation failed in a production-like host:"
            + Environment.NewLine
            + string.Join(Environment.NewLine, errors.Select(static e => " - " + e)));
    }
}
