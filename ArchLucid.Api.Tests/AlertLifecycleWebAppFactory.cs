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
    /// <summary>
    ///     InMemory host start/dispose should take seconds. Bound dispose so an <c>IHostedService</c> that ignores its
    ///     shutdown token cannot wedge the host for the full 75-minute CI blame-hang ceiling (CI #2138, #2162). Set
    ///     comfortably above a normal dispose (seconds) and far below the blame-hang budget.
    /// </summary>
    private static readonly TimeSpan BoundedDisposeTimeout = TimeSpan.FromMinutes(2);

    private readonly object _hostLifecycleLock = new();

    private Task<IServiceProvider>? _ensureServicesTask;

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
        lock (_hostLifecycleLock)
        {
            _ensureServicesTask ??= StartServicesCoreAsync();

            return _ensureServicesTask;
        }
    }

    private Task<IServiceProvider> StartServicesCoreAsync()
    {
        Console.Error.WriteLine(
            $"[AlertLifecycleWebAppFactory] Host startup beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        // Services access and first CreateClient share one Task.Run worker so WebApplicationFactory.EnsureServer
        // is never entered concurrently from an abandoned startup thread and a later CreateClient (CI #2168).
        return IntegrationTestHostStartup.EnsureStartedAsync(() =>
        {
            IServiceProvider services = Services;
            _ = CreateClient();

            Console.Error.WriteLine(
                $"[AlertLifecycleWebAppFactory] Services resolved + CreateClient complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            return services;
        });
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
    ///     Bounds <c>await using</c> host teardown. If a hosted service ignores its shutdown token and wedges the host,
    ///     the wedged dispose is abandoned (a blocked dispose cannot be force-aborted) so the test completes fast and the
    ///     stall is named in CI logs in seconds — instead of hanging until the 75-minute blame-hang ceiling.
    /// </summary>
    public override async ValueTask DisposeAsync()
    {
        Console.Error.WriteLine(
            $"[AlertLifecycleWebAppFactory] Dispose beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        Task disposeTask = base.DisposeAsync().AsTask();

        Task winner = await Task.WhenAny(disposeTask, Task.Delay(BoundedDisposeTimeout));

        if (winner != disposeTask)
        {
            Console.Error.WriteLine(
                $"[AlertLifecycleWebAppFactory] Host dispose exceeded {BoundedDisposeTimeout.TotalSeconds:N0}s; "
                + "abandoning wedged dispose to avoid the CI blame-hang ceiling. A hosted service likely ignored its shutdown token.");

            ObserveAbandonedDispose(disposeTask);

            return;
        }

        await disposeTask;
    }

    /// <summary>
    ///     Swallows the abandoned dispose result so a later fault cannot surface as an
    ///     <c>UnobservedTaskException</c> that tears down the test host process.
    /// </summary>
    private static void ObserveAbandonedDispose(Task disposeTask)
    {
        ArgumentNullException.ThrowIfNull(disposeTask);

        _ = disposeTask.ContinueWith(
            static completed => { _ = completed.Exception; },
            CancellationToken.None,
            TaskContinuationOptions.OnlyOnFaulted,
            TaskScheduler.Default);
    }
}
