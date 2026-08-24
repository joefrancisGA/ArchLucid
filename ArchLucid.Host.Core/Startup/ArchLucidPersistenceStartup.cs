using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Host.Core.Startup;

/// <summary>SQL DbUp migrations, idempotent consolidated bootstrap, and optional demo seed (shared by API and Worker).</summary>
public static class ArchLucidPersistenceStartup
{
    // ArchLucid.sql / ArchLucid.System.sql are split into hundreds of GO batches; brownfield idempotent
    // checks still round-trip per batch. 30s was too tight once the consolidated script grew past ~500 batches.
    private const int DefaultSchemaBootstrapTimeoutSeconds = SqlCommandTimeouts.ExtendedSeconds;

    /// <summary>
    ///     Prefers the elevated bootstrap connection (DDL + self-granting DENY/GRANT rights); falls back to the
    ///     runtime connection for hosts that have not split identities (pre-existing dev/CI behavior).
    /// </summary>
    private static string? ResolveDevelopmentTenantBootstrapConnectionString(SqlTopologyOptions sqlTopology)
    {
        return string.IsNullOrWhiteSpace(sqlTopology.DevelopmentTenantBootstrapConnectionString)
            ? sqlTopology.DevelopmentTenantConnectionString
            : sqlTopology.DevelopmentTenantBootstrapConnectionString;
    }

    private static async Task RunSystemSchemaBootstrapIfAvailableAsync(
        WebApplication app,
        string systemConnectionString,
        ArchLucidPersistenceOptions persistenceOptions)
    {
        string systemScriptPath = PersistenceScriptPaths.ResolveSystemScriptPath();

        if (!File.Exists(systemScriptPath))
        {
            app.Logger.LogWarning(
                "Startup: consolidated system DDL not found at {Path}; skipping system-plane bootstrap.",
                systemScriptPath);

            return;
        }

        app.Logger.LogInformation(
            "Startup: running system-plane ISchemaBootstrapper ({Script}).",
            systemScriptPath);

        SqlConnectionFactory connectionFactory = new(systemConnectionString);
        SqlSchemaBootstrapper bootstrapper = new(
            connectionFactory,
            systemScriptPath,
            persistenceOptions.DefaultSqlCommandTimeoutSeconds > 0
                ? persistenceOptions.DefaultSqlCommandTimeoutSeconds
                : DefaultSchemaBootstrapTimeoutSeconds);
        int bootstrapTimeoutSeconds = persistenceOptions.DefaultSqlCommandTimeoutSeconds > 0
            ? persistenceOptions.DefaultSqlCommandTimeoutSeconds
            : DefaultSchemaBootstrapTimeoutSeconds;
        using CancellationTokenSource cts = new(TimeSpan.FromSeconds(bootstrapTimeoutSeconds));

        await bootstrapper.EnsureSchemaAsync(cts.Token).ConfigureAwait(false);

        app.Logger.LogInformation("Startup: system-plane schema bootstrap completed.");
    }

    public static async Task RunSchemaBootstrapMigrationsAndOptionalDemoSeedAsync(WebApplication app)
    {
        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(app.Configuration);
        ArchLucidPersistenceOptions persistenceOptions =
            app.Configuration.GetSection(ArchLucidPersistenceOptions.SectionPath).Get<ArchLucidPersistenceOptions>()
            ?? new ArchLucidPersistenceOptions();
        bool storageIsSql = ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider);

        if (!storageIsSql && app.Environment.IsDevelopment())
        {
            app.Logger.LogWarning(
                "ArchLucid:StorageProvider is InMemory in Development — reviews and other persisted state are lost when the API process exits. "
                + "Use Sql with ConnectionStrings:ArchLucid for durable local dev (see docker-compose.yml or "
                + "dotnet run --project ArchLucid.Cli -- dev up --sql-only).");
        }

        // DbUp must run before SqlSchemaBootstrapper (ArchLucid.sql). On an empty database, the bootstrapper
        // creates objects that migration 001 also creates; DbUp then sees an empty journal and fails with
        // "already an object named …". Integration tests use DbUp-only on a fresh catalog; API startup should match.
        // After migrations, ArchLucid.sql is idempotent (IF OBJECT_ID …) and aligns greenfield with the reference DDL.

        if (storageIsSql)
        {
            SqlTopologyOptions sqlTopology =
                app.Configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>() ??
                new SqlTopologyOptions();

            if (sqlTopology.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs)
            {
                string? systemConnectionString =
                    ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(app.Configuration);

                if (string.IsNullOrWhiteSpace(systemConnectionString))
                {
                    app.Logger.LogWarning(
                        "Startup: ConnectionStrings:ArchLucidSystem is not set; skipping system-plane DbUp migrations.");
                }
                else
                {
                    app.Logger.LogInformation(
                        "Startup: running system-plane DbUp migrations (ArchLucid.Persistence/Migrations/System).");

                    try
                    {
                        DatabaseMigrator.RunSystem(systemConnectionString);

                        app.Logger.LogInformation("Startup: system-plane DbUp migrations completed successfully.");

                        await RunSystemSchemaBootstrapIfAvailableAsync(app, systemConnectionString, persistenceOptions)
                            .ConfigureAwait(false);
                    }
                    catch (Exception ex)
                    {
                        if (!persistenceOptions.AllowDegradedStartupAfterMigrationFailure)
                            throw;

                        app.Logger.LogCritical(
                            ex,
                            "Startup: system-plane DbUp migrations failed; continuing in degraded mode (ArchLucid:Persistence:AllowDegradedStartupAfterMigrationFailure=true).");

                        StartupMigrationHealthState? health = app.Services.GetService<StartupMigrationHealthState>();

                        if (health is not null)
                            health.MarkMigrationFailed();
                    }
                }

                string? tenantBootstrapConnectionString =
                    ResolveDevelopmentTenantBootstrapConnectionString(sqlTopology);

                if (!string.IsNullOrWhiteSpace(tenantBootstrapConnectionString))
                {
                    app.Logger.LogInformation(
                        "Startup: running tenant-plane DbUp migrations (ArchLucid:SqlTopology:DevelopmentTenantBootstrapConnectionString).");

                    try
                    {
                        DatabaseMigrator.RunTenant(tenantBootstrapConnectionString);

                        app.Logger.LogInformation("Startup: tenant-plane DbUp migrations completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        if (!persistenceOptions.AllowDegradedStartupAfterMigrationFailure)
                            throw;

                        app.Logger.LogCritical(
                            ex,
                            "Startup: tenant-plane DbUp migrations failed; continuing in degraded mode (ArchLucid:Persistence:AllowDegradedStartupAfterMigrationFailure=true).");

                        StartupMigrationHealthState? health = app.Services.GetService<StartupMigrationHealthState>();

                        if (health is not null)
                            health.MarkMigrationFailed();
                    }
                }
            }
            else
            {
                string? connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(app.Configuration);

                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    app.Logger.LogWarning(
                        "Startup: ConnectionStrings:ArchLucid is not set; skipping DbUp migrations.");

                    ArchLucidInstrumentation.RecordStartupConfigWarning(
                        StartupValidationWarningRuleNames.SqlConnectionStringMissingSkipMigrations);
                }
                else
                {
                    app.Logger.LogInformation(
                        "Startup: running DbUp migrations (embedded scripts under ArchLucid.Persistence/Migrations).");

                    try
                    {
                        DatabaseMigrator.Run(connectionString);

                        app.Logger.LogInformation("Startup: DbUp migrations completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        if (!persistenceOptions.AllowDegradedStartupAfterMigrationFailure)
                            throw;

                        app.Logger.LogCritical(
                            ex,
                            "Startup: DbUp migrations failed; continuing in degraded mode (ArchLucid:Persistence:AllowDegradedStartupAfterMigrationFailure=true).");

                        StartupMigrationHealthState? health = app.Services.GetService<StartupMigrationHealthState>();

                        if (health is not null)
                            health.MarkMigrationFailed();
                    }
                }
            }
        }

        using (IServiceScope scope = app.Services.CreateScope())
        {
            if (storageIsSql)
            {
                app.Logger.LogInformation(
                    "Startup: running ISchemaBootstrapper (ArchLucid:StorageProvider=Sql).");

                ISchemaBootstrapper bootstrapper = scope.ServiceProvider.GetRequiredService<ISchemaBootstrapper>();
                int bootstrapTimeoutSeconds = persistenceOptions.DefaultSqlCommandTimeoutSeconds > 0
                    ? persistenceOptions.DefaultSqlCommandTimeoutSeconds
                    : DefaultSchemaBootstrapTimeoutSeconds;
                using CancellationTokenSource cts = new(TimeSpan.FromSeconds(bootstrapTimeoutSeconds));

                await bootstrapper.EnsureSchemaAsync(cts.Token).ConfigureAwait(false);

                app.Logger.LogInformation("Startup: schema bootstrap completed.");

                SqlTopologyOptions topology = app.Configuration.GetSection(SqlTopologyOptions.SectionPath)
                    .Get<SqlTopologyOptions>() ?? new SqlTopologyOptions();

                string? catalogConnectionString =
                    topology.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs
                        ? topology.DevelopmentTenantConnectionString
                        : ArchLucidConfigurationBridge.ResolveSqlConnectionString(app.Configuration);

                // Hosted Container Apps often use ASPNETCORE_ENVIRONMENT=Production while still binding the
                // well-known ApiKey demo scope (11111111-… / 22222222-… / 33333333-…). Seed that scope whenever
                // the ApiKey tenant claim is DefaultTenant — not only when Environment.IsDevelopment().
                bool apiKeyUsesDefaultTenant =
                    Guid.TryParse(app.Configuration["Authentication:ApiKey:TenantId"], out Guid apiKeyTenantId)
                    && apiKeyTenantId == ScopeIds.DefaultTenant;

                if (!string.IsNullOrWhiteSpace(catalogConnectionString)
                    && (app.Environment.IsDevelopment() || apiKeyUsesDefaultTenant))
                    DevelopmentDefaultScopeTenantBootstrap.TryEnsure(catalogConnectionString, app.Logger);

                if (!string.IsNullOrWhiteSpace(catalogConnectionString) && app.Environment.IsDevelopment())
                {
                    try
                    {
                        using CancellationTokenSource resetProcCts = new(
                            TimeSpan.FromSeconds(SqlCommandTimeouts.ExtendedSeconds));
                        await SqlDevelopmentCatalogResetCommands
                            .EnsureProcedureAsync(catalogConnectionString, resetProcCts.Token)
                            .ConfigureAwait(false);
                    }
                    catch (Exception ex)
                    {
                        app.Logger.LogWarning(
                            ex,
                            "Startup: could not deploy dbo.usp_ArchLucid_ResetDevelopmentCatalog to master. SSMS reset will be unavailable until the next successful Reset Database.");
                    }
                }

                TryValidateAuditImmutabilityIfRequired(app, archLucidOptions);
                TryValidateSealedEvidenceImmutabilityIfRequired(app, archLucidOptions);
                TryValidateCommittedRunHeaderImmutabilityIfRequired(app, archLucidOptions);
            }
        }

        DemoOptions? demo = app.Configuration.GetSection(DemoOptions.SectionName).Get<DemoOptions>();

        if (demo is null || !DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(app.Environment, demo))
            return;

        app.Logger.LogInformation(
            "Startup: showcase demo seed enabled; running {Service}.",
            nameof(IDemoSeedService));

        try
        {
            using IServiceScope seedScope = app.Services.CreateScope();
            IDemoSeedService demoSeed = seedScope.ServiceProvider.GetRequiredService<IDemoSeedService>();

            await demoSeed.SeedAsync(CancellationToken.None).ConfigureAwait(false);

            app.Logger.LogInformation("Startup: demo seed completed.");
        }
        catch (Exception ex)
        {
            if (app.Logger.IsEnabled(LogLevel.Warning))

                app.Logger.LogWarning(ex, "Startup: demo seed failed; continuing without demo data.");
        }
    }

    private static void TryValidateAuditImmutabilityIfRequired(WebApplication app, ArchLucidOptions archLucidOptions)
    {
        if (!SqlAuditImmutabilityRules.ShouldValidate(app.Environment, app.Configuration, archLucidOptions))
            return;

        string? connectionString = SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(app.Configuration);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Audit immutability validation requires a tenant catalog connection in production-like hosts. "
                + "Configure ConnectionStrings:ArchLucid (SingleCatalog) or ArchLucid:SqlTopology:DevelopmentTenantConnectionString "
                + "(SystemWithPerTenantCatalogs template catalog).");
        }

        app.Logger.LogInformation("Startup: validating audit immutability on tenant catalog.");

        SqlAuditImmutabilityRules.ValidateOrThrow(connectionString, app.Logger);
    }

    private static void TryValidateSealedEvidenceImmutabilityIfRequired(WebApplication app, ArchLucidOptions archLucidOptions)
    {
        if (!SqlSealedEvidenceImmutabilityRules.ShouldValidate(app.Environment, app.Configuration, archLucidOptions))
            return;

        string? connectionString = SqlSealedEvidenceImmutabilityRules.ResolveCatalogConnectionString(app.Configuration);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Sealed evidence immutability validation requires a tenant catalog connection in production-like hosts. "
                + "Configure ConnectionStrings:ArchLucid (SingleCatalog) or ArchLucid:SqlTopology:DevelopmentTenantConnectionString "
                + "(SystemWithPerTenantCatalogs template catalog).");
        }

        app.Logger.LogInformation("Startup: validating sealed evidence immutability on tenant catalog.");

        SqlSealedEvidenceImmutabilityRules.ValidateOrThrow(connectionString, app.Logger);
    }

    private static void TryValidateCommittedRunHeaderImmutabilityIfRequired(WebApplication app, ArchLucidOptions archLucidOptions)
    {
        if (!SqlCommittedRunHeaderImmutabilityRules.ShouldValidate(app.Environment, app.Configuration, archLucidOptions))
            return;

        string? connectionString = SqlCommittedRunHeaderImmutabilityRules.ResolveCatalogConnectionString(app.Configuration);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Committed run header immutability validation requires a tenant catalog connection in production-like hosts. "
                + "Configure ConnectionStrings:ArchLucid (SingleCatalog) or ArchLucid:SqlTopology:DevelopmentTenantConnectionString "
                + "(SystemWithPerTenantCatalogs template catalog).");
        }

        app.Logger.LogInformation("Startup: validating committed run header immutability on tenant catalog.");

        SqlCommittedRunHeaderImmutabilityRules.ValidateOrThrow(connectionString, app.Logger);
    }
}
