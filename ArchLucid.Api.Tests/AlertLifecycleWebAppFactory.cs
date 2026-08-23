using ArchLucid.TestSupport;

namespace ArchLucid.Api.Tests;

/// <summary>
///     API host with <c>ArchLucid:StorageProvider=InMemory</c> so advisory scans use in-memory authority + alert stores
///     (same DI graph as production, different backing stores). No SQL catalog is provisioned — persistence never touches SQL.
/// </summary>
/// <remarks>
///     <see cref="ArchLucid.Core.Integration.IntegrationEventsOptions" /> clears so
///     <see cref="ArchLucid.Api.Health.AzureServiceBusNamespaceHealthCheck" /> does not open real Service Bus connections
///     under CI env leakage (same posture as <see cref="OpenApiContractWebAppFactory" />).
/// </remarks>
public sealed class AlertLifecycleWebAppFactory : IntegrationTestWebAppFactoryBase
{
    /// <summary>Creates an in-memory integration host without SQL catalog provisioning.</summary>
    public AlertLifecycleWebAppFactory()
        : base("InMemory")
    {
    }

    /// <inheritdoc />
    protected override string FactoryLogPrefix => nameof(AlertLifecycleWebAppFactory);

    /// <inheritdoc />
    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = "InMemory";
        settings["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value;
        settings["IntegrationEvents:QueueOrTopicName"] = "";
        settings["IntegrationEvents:ServiceBusConnectionString"] = "";
        settings["IntegrationEvents:ServiceBusFullyQualifiedNamespace"] = "";
        settings["IntegrationEvents:ServiceBusManagedIdentityClientId"] = "";
        settings["ArchLucidAuth:Mode"] = "DevelopmentBypass";
        settings["Authentication:ApiKey:DevelopmentBypassAll"] = "true";
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        // Background TrialFunnelHealthProbe defaults to http://127.0.0.1:5000 under TestServer; disable for integration hosts.
        settings["Demo:Enabled"] = "false";
        // appsettings.Development.json enables Demo:SeedOnStartup; integration tests seed explicitly when needed.
        settings["Demo:SeedOnStartup"] = "false";
        // Agentic query rewrite/HyDE call the LLM completion router. Smoke tests assert vector search only.
        settings["Retrieval:Advanced:Enabled"] = "false";
    }
}
