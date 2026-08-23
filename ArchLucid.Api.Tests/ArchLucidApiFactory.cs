namespace ArchLucid.Api.Tests;

/// <summary>
///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> for the real API: provisions a dedicated SQL Server catalog per
///     instance,
///     wires <c>ConnectionStrings:ArchLucid</c>, and defaults <c>ArchLucid:StorageProvider=InMemory</c> so authority runs
///     stay fast
///     while SQL-backed probes can still open <see cref="Microsoft.Data.SqlClient.SqlConnection" /> against the same catalog when needed.
/// </summary>
/// <remarks>
///     <para>
///         SQL Server connectivity is resolved by
///         <see cref="ArchLucid.TestSupport.SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString" />:
///         <see cref="ArchLucid.TestSupport.TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable" />, then
///         <see cref="ArchLucid.TestSupport.TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable" />,
///         then Windows <c>localhost</c> integrated security.
///     </para>
///     <para>
///         In-memory configuration forces <c>AgentExecution:Mode=Simulator</c>, clears <c>AzureOpenAI:*</c> so user
///         secrets cannot enable real completion clients (503 from circuit breaker); sets
///         <c>DataConsistency:InitialDelaySeconds=0</c> and <c>HostLeaderElection:Enabled=false</c> so
///         <see cref="ArchLucid.Application.DataConsistency.DataConsistencyHealthCheck" /> can complete its first reconciliation promptly (otherwise
///         <c>appsettings.Advanced.json</c> 120s delay wins over Development and readiness/detailed health aggregate
///         Unhealthy → 503; see CI greenfield boot env comments). Rate limits are
///         raised for stable CI/local runs.
///     </para>
/// </remarks>
public class ArchLucidApiFactory : SqlIntegrationTestWebAppFactoryBase
{
    private static readonly SqlCatalogProvisioningProfile AuthorityCatalogProfile = new(
        DatabaseNamePrefix: "ArchLucidTest_",
        PinSqlCatalogEnvironment: false);

    private static readonly SqlCatalogProvisioningProfile AuthoritySqlStorageCatalogProfile = new(
        DatabaseNamePrefix: "ArchLucidTest_",
        PinSqlCatalogEnvironment: true);

    private static readonly SqlCatalogProvisioningProfile SharedSqlCatalogProfile = new(
        DatabaseNamePrefix: "ArchLucidTest_",
        PinSqlCatalogEnvironment: true);

    /// <summary>Creates the factory, ensures the unique test database exists, and applies migrations.</summary>
    public ArchLucidApiFactory()
        : this(sqlAuthorityStorage: false)
    {
    }

    /// <summary>Ephemeral catalog with SQL authority storage (forensics cross-host probes).</summary>
    internal ArchLucidApiFactory(bool sqlAuthorityStorage)
        : base(
            sqlAuthorityStorage ? "Sql" : "InMemory",
            sqlAuthorityStorage ? AuthoritySqlStorageCatalogProfile : AuthorityCatalogProfile)
    {
    }

    /// <summary>Reuses an existing SQL catalog (second host in the same integration test).</summary>
    protected ArchLucidApiFactory(string existingSqlConnectionString)
        : base("Sql", existingSqlConnectionString, SharedSqlCatalogProfile)
    {
    }

    /// <inheritdoc />
    protected override string FactoryLogPrefix => nameof(ArchLucidApiFactory);

    /// <inheritdoc />
    protected override TimeSpan HttpClientTimeout => TimeSpan.FromMinutes(5);

    /// <inheritdoc />
    protected override void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        // appsettings.Development.json enables Demo:SeedOnStartup; integration tests seed explicitly via IDemoSeedService.
        settings["Demo:SeedOnStartup"] = "false";
    }
}
