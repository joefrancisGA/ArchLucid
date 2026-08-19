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
public sealed class AlertLifecycleWebAppFactory : BaseIntegrationTestFixture
{
    private const string LogPrefix = nameof(AlertLifecycleWebAppFactory);

    private readonly IntegrationTestStorageProviderEnvironment _storageProviderEnvironment = new("InMemory");
    private readonly IntegrationTestWebAppFactoryHostLifecycle _hostLifecycle = new();

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

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        client.Timeout = IntegrationTestHttpCancellation.DefaultRequestTimeout;
    }

    /// <summary>
    ///     Returns a single in-flight host-start task per factory instance so concurrent
    ///     <see cref="EnsureServicesStartedAsync" /> / <see cref="CreateBoundedClientAsync" /> calls do not race
    ///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> internals (CI #2168).
    /// </summary>
    internal Task<IServiceProvider> EnsureServicesStartedAsync()
    {
        return _hostLifecycle.EnsureServicesStartedAsync(LogPrefix, StartServicesCoreAsync);
    }

    private Task<IServiceProvider> StartServicesCoreAsync()
    {
        return IntegrationTestStorageProviderHostGate.RunExclusiveAsync(StartServicesCoreUnderGateAsync);
    }

    private async Task<IServiceProvider> StartServicesCoreUnderGateAsync()
    {
        _storageProviderEnvironment.Apply();

        Console.Error.WriteLine(
            $"[{LogPrefix}] Host startup beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        // Services access and first CreateClient share one Task.Run worker so WebApplicationFactory.EnsureServer
        // is never entered concurrently from an abandoned startup thread and a later CreateClient (CI #2168).
        IServiceProvider services = await IntegrationTestHostStartup.EnsureStartedAsync(() =>
        {
            IServiceProvider resolvedServices = Services;
            _ = CreateClient();

            Console.Error.WriteLine(
                $"[{LogPrefix}] Services resolved + CreateClient complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            return resolvedServices;
        }).ConfigureAwait(false);

        return services;
    }

    /// <summary>
    ///     Ensures the host is started (including TestServer client cache priming), then returns an
    ///     <see cref="HttpClient" />.
    /// </summary>
    internal async Task<HttpClient> CreateBoundedClientAsync()
    {
        await EnsureServicesStartedAsync().ConfigureAwait(false);

        return await IntegrationTestHostStartup.EnsureCompletedAsync(
            () => CreateClient(),
            IntegrationTestHostStartup.DefaultClientCreationTimeout).ConfigureAwait(false);
    }

    /// <summary>
    ///     Waits for in-flight startup to settle, then bounds <c>await using</c> host teardown.
    /// </summary>
    public override ValueTask DisposeAsync()
    {
        return _hostLifecycle.DisposeHostAsync(LogPrefix, () => base.DisposeAsync());
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _storageProviderEnvironment.Dispose();

        base.Dispose(disposing);
    }
}

