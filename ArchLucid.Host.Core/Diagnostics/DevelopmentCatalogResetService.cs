using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>
///     Development-only SQL catalog reset — mirrors <see cref="ArchLucidPersistenceStartup" /> after drop/recreate.
/// </summary>
public sealed class DevelopmentCatalogResetService(
    IConfiguration configuration,
    IWebHostEnvironment environment,
    ISchemaBootstrapper schemaBootstrapper,
    IDemoSeedService demoSeedService,
    IOptions<DemoOptions> demoOptions,
    IOptions<ArchLucidPersistenceOptions> persistenceOptions,
    ILogger<DevelopmentCatalogResetService> logger) : IDevelopmentCatalogResetService
{
    private const int DefaultSchemaBootstrapTimeoutSeconds = 300;

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IWebHostEnvironment _environment =
        environment ?? throw new ArgumentNullException(nameof(environment));

    private readonly ISchemaBootstrapper _schemaBootstrapper =
        schemaBootstrapper ?? throw new ArgumentNullException(nameof(schemaBootstrapper));

    private readonly IDemoSeedService _demoSeedService =
        demoSeedService ?? throw new ArgumentNullException(nameof(demoSeedService));

    private readonly DemoOptions _demoOptions =
        demoOptions?.Value ?? throw new ArgumentNullException(nameof(demoOptions));

    private readonly ArchLucidPersistenceOptions _persistenceOptions =
        persistenceOptions?.Value ?? throw new ArgumentNullException(nameof(persistenceOptions));

    private readonly ILogger<DevelopmentCatalogResetService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<DevelopmentCatalogResetResult> ResetToFreshInstallAsync(CancellationToken cancellationToken = default)
    {
        if (!_environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Development catalog reset is available only when the host environment is Development.");
        }

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(_configuration);

        if (!ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
        {
            throw new InvalidOperationException(
                "Development catalog reset requires ArchLucid:StorageProvider=Sql.");
        }

        ResolvedDevelopmentCatalog resolved = ResolveDevelopmentCatalog(_configuration);
        string catalogName = resolved.CatalogName;

        _logger.LogWarning(
            "Development catalog reset requested for {CatalogName}. Dropping and recreating the catalog.",
            catalogName);

        await SqlTenantCatalogAdminCommands.DropCatalogIfExistsAsync(resolved.RuntimeConnectionString, cancellationToken)
            .ConfigureAwait(false);

        SqlConnection.ClearAllPools();

        await SqlTenantCatalogAdminCommands.EnsureCatalogExistsAsync(resolved.RuntimeConnectionString, cancellationToken)
            .ConfigureAwait(false);

        if (!string.IsNullOrWhiteSpace(resolved.MigrationConnectionString))
        {
            SqlTopologyOptions topology =
                _configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>()
                ?? new SqlTopologyOptions();

            if (topology.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
                DatabaseMigrator.RunTenant(resolved.MigrationConnectionString);
            else
                DatabaseMigrator.Run(resolved.MigrationConnectionString);
        }

        int bootstrapTimeoutSeconds = _persistenceOptions.DefaultSqlCommandTimeoutSeconds > 0
            ? _persistenceOptions.DefaultSqlCommandTimeoutSeconds
            : DefaultSchemaBootstrapTimeoutSeconds;

        using CancellationTokenSource bootstrapCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        bootstrapCts.CancelAfter(TimeSpan.FromSeconds(bootstrapTimeoutSeconds));

        await _schemaBootstrapper.EnsureSchemaAsync(bootstrapCts.Token).ConfigureAwait(false);

        DevelopmentDefaultScopeTenantBootstrap.TryEnsure(resolved.RuntimeConnectionString, _logger);

        bool demoSeedApplied = false;

        if (DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(_environment, _demoOptions))
        {
            await _demoSeedService.SeedAsync(cancellationToken).ConfigureAwait(false);
            demoSeedApplied = true;
        }

        _logger.LogInformation(
            "Development catalog reset completed for {CatalogName}. Demo seed applied: {DemoSeedApplied}.",
            catalogName,
            demoSeedApplied);

        return new DevelopmentCatalogResetResult
        {
            CatalogName = catalogName,
            DemoSeedApplied = demoSeedApplied,
        };
    }

    private static ResolvedDevelopmentCatalog ResolveDevelopmentCatalog(IConfiguration configuration)
    {
        SqlTopologyOptions topology =
            configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>()
            ?? new SqlTopologyOptions();

        if (topology.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            string? runtimeConnectionString = topology.DevelopmentTenantConnectionString;

            if (string.IsNullOrWhiteSpace(runtimeConnectionString))
            {
                throw new InvalidOperationException(
                    "Development catalog reset requires ArchLucid:SqlTopology:DevelopmentTenantConnectionString "
                    + "when SqlTopology mode is SystemWithPerTenantCatalogs.");
            }

            string migrationConnectionString = string.IsNullOrWhiteSpace(topology.DevelopmentTenantBootstrapConnectionString)
                ? runtimeConnectionString
                : topology.DevelopmentTenantBootstrapConnectionString;

            return new ResolvedDevelopmentCatalog(
                ReadCatalogName(runtimeConnectionString),
                runtimeConnectionString,
                migrationConnectionString);
        }

        string? connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Development catalog reset requires ConnectionStrings:ArchLucid when SqlTopology mode is SingleCatalog.");
        }

        return new ResolvedDevelopmentCatalog(ReadCatalogName(connectionString), connectionString, connectionString);
    }

    private static string ReadCatalogName(string connectionString)
    {
        SqlConnectionStringBuilder builder = new(connectionString);

        if (string.IsNullOrWhiteSpace(builder.InitialCatalog))
        {
            throw new InvalidOperationException("Connection string must specify Initial Catalog.");
        }

        return builder.InitialCatalog;
    }

    private sealed record ResolvedDevelopmentCatalog(
        string CatalogName,
        string RuntimeConnectionString,
        string MigrationConnectionString);
}
