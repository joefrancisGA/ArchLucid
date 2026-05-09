using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class StorageRules
{
    public static void Collect(IConfiguration configuration, ArchLucidOptions archLucidOptions, List<string> errors)
    {
        bool storageIsSql = ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider);

        if (!string.IsNullOrWhiteSpace(archLucidOptions.StorageProvider) &&
            !string.Equals(archLucidOptions.StorageProvider, "InMemory", StringComparison.OrdinalIgnoreCase) &&
            !storageIsSql)

            errors.Add(
                "ArchLucid:StorageProvider must be 'InMemory' or 'Sql' when set.");

        IntegrationEventsOptions integrationEvents =
            configuration.GetSection(IntegrationEventsOptions.SectionName).Get<IntegrationEventsOptions>()
            ?? new IntegrationEventsOptions();

        if (integrationEvents.TransactionalOutboxEnabled && !storageIsSql)

            errors.Add(
                "IntegrationEvents:TransactionalOutboxEnabled requires ArchLucid:StorageProvider Sql (transactional enqueue needs a shared SQL transaction).");

        string? connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration);

        if (storageIsSql && string.IsNullOrWhiteSpace(connectionString))
            errors.Add(
                "ConnectionStrings:ArchLucid is required when ArchLucid:StorageProvider is Sql (or unset, defaulting to Sql).");

        SqlTopologyOptions? sqlTopology =
            configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>();

        if (storageIsSql && sqlTopology?.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            if (string.IsNullOrWhiteSpace(ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(configuration)))
                errors.Add("ConnectionStrings:ArchLucidSystem is required when ArchLucid:SqlTopology:Mode is SystemWithPerTenantCatalogs.");

            if (string.IsNullOrWhiteSpace(sqlTopology.TenantCatalogConnectionStringTemplate))
                errors.Add(
                    "ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate is required when ArchLucid:SqlTopology:Mode is SystemWithPerTenantCatalogs.");
        }
    }
}
