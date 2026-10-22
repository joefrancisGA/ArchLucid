using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;

using Microsoft.AspNetCore.Hosting;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class SqlFailoverRules
{
    /// <summary>
    ///     When <see cref="SqlServerOptions.FailoverGroupListenerFqdn" /> is set in Production, the primary SQL
    ///     connection string must contain that listener hostname so geo-failover routes writes automatically.
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

        if (!ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            return;

        string? connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration);

        if (string.IsNullOrWhiteSpace(connectionString))
            return;

        SqlServerOptions sqlServerOptions =
            configuration.GetSection(SqlServerOptions.SectionName).Get<SqlServerOptions>() ?? new SqlServerOptions();

        string? listenerFqdn = sqlServerOptions.FailoverGroupListenerFqdn?.Trim();

        if (string.IsNullOrEmpty(listenerFqdn))
            return;

        if (connectionString.Contains(listenerFqdn, StringComparison.OrdinalIgnoreCase))
            return;

        errors.Add(
            "ConnectionStrings:ArchLucid does not contain the failover group listener FQDN "
            + $"'{listenerFqdn}'. In Production, the primary connection string must use the failover group "
            + "read/write listener so automatic geo-failover is transparent to the application.");
    }
}
