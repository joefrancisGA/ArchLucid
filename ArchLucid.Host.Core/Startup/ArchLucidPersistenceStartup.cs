using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

namespace ArchLucid.Host.Core.Startup;

/// <summary>SQL DbUp migrations, idempotent consolidated bootstrap, and optional demo seed (shared by API and Worker).</summary>
public static class ArchLucidPersistenceStartup
{
    private const int DefaultSchemaBootstrapTimeoutSeconds = 30;

    public static void RunSchemaBootstrapMigrationsAndOptionalDemoSeed(WebApplication app)
    {
        RlsBypassPolicyBootstrap.Apply(app.Configuration, app.Environment, app.Logger);

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(app.Configuration);
        ArchLucidPersistenceOptions persistenceOptions =
            app.Configuration.GetSection(ArchLucidPersistenceOptions.SectionPath).Get<ArchLucidPersistenceOptions>()
            ?? new ArchLucidPersistenceOptions();
        bool storageIsSql = ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider);

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

                if (!string.IsNullOrWhiteSpace(sqlTopology.DevelopmentTenantConnectionString))
                {
                    app.Logger.LogInformation(
                        "Startup: running tenant-plane DbUp migrations (ArchLucid:SqlTopology:DevelopmentTenantConnectionString).");

                    try
                    {
                        DatabaseMigrator.RunTenant(sqlTopology.DevelopmentTenantConnectionString);

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

            if (storageIsSql)
            {
                app.Logger.LogInformation(
                    "Startup: running ISchemaBootstrapper (ArchLucid:StorageProvider=Sql).");

                ISchemaBootstrapper bootstrapper = scope.ServiceProvider.GetRequiredService<ISchemaBootstrapper>();
                int bootstrapTimeoutSeconds = persistenceOptions.DefaultSqlCommandTimeoutSeconds > 0
                    ? persistenceOptions.DefaultSqlCommandTimeoutSeconds
                    : DefaultSchemaBootstrapTimeoutSeconds;
                using CancellationTokenSource cts = new(TimeSpan.FromSeconds(bootstrapTimeoutSeconds));
                using (SqlRowLevelSecurityBypassAmbient.Enter())
                {
                    bootstrapper.EnsureSchemaAsync(cts.Token).GetAwaiter().GetResult();

                    app.Logger.LogInformation("Startup: schema bootstrap completed.");

                    SqlTopologyOptions topology = app.Configuration.GetSection(SqlTopologyOptions.SectionPath)
                        .Get<SqlTopologyOptions>() ?? new SqlTopologyOptions();

                    string? catalogConnectionString =
                        topology.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs
                            ? topology.DevelopmentTenantConnectionString
                            : ArchLucidConfigurationBridge.ResolveSqlConnectionString(app.Configuration);

                    if (app.Environment.IsDevelopment() && !string.IsNullOrWhiteSpace(catalogConnectionString))
                        DevelopmentDefaultScopeTenantBootstrap.TryEnsure(catalogConnectionString, app.Logger);
                }
            }

        if (!app.Environment.IsDevelopment())
            return;

        DemoOptions? demo = app.Configuration.GetSection(DemoOptions.SectionName).Get<DemoOptions>();

        if (demo is not { Enabled: true, SeedOnStartup: true })
            return;

        app.Logger.LogInformation(
            "Startup: Demo:SeedOnStartup=true; running {Service}.",
            nameof(IDemoSeedService));

        try
        {
            using IServiceScope seedScope = app.Services.CreateScope();
            IDemoSeedService demoSeed = seedScope.ServiceProvider.GetRequiredService<IDemoSeedService>();

            // SQL RLS predicates would otherwise block trusted startup inserts (same pattern as trial bootstrap).
            if (storageIsSql)

                using (SqlRowLevelSecurityBypassAmbient.Enter())
                    demoSeed.SeedAsync(CancellationToken.None).GetAwaiter().GetResult();

            else

                demoSeed.SeedAsync(CancellationToken.None).GetAwaiter().GetResult();

            app.Logger.LogInformation("Startup: demo seed completed.");
        }
        catch (Exception ex)
        {
            if (app.Logger.IsEnabled(LogLevel.Warning))

                app.Logger.LogWarning(ex, "Startup: demo seed failed; continuing without demo data.");
        }
    }
}
