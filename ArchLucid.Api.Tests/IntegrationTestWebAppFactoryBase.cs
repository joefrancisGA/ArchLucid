namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared host lifecycle, storage-provider env pinning, and bounded startup for integration
///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> fixtures.
/// </summary>
public abstract class IntegrationTestWebAppFactoryBase : BaseIntegrationTestFixture, IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactoryHostLifecycle _hostLifecycle = new();

    /// <summary>Single-flight startup and bounded dispose for SQL catalog teardown helpers.</summary>
    internal IntegrationTestWebAppFactoryHostLifecycle HostLifecycle => _hostLifecycle;

    private readonly IntegrationTestStorageProviderEnvironment _storageProviderEnvironment;

    /// <summary>Creates the factory and pins <paramref name="storageProvider" /> for the host lifetime.</summary>
    protected IntegrationTestWebAppFactoryBase(string storageProvider)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageProvider);

        StorageProvider = storageProvider;
        _storageProviderEnvironment = new IntegrationTestStorageProviderEnvironment(storageProvider);
    }

    /// <summary>Storage provider forced for this host (<c>InMemory</c> or <c>Sql</c>).</summary>
    protected string StorageProvider
    {
        get;
    }

    /// <summary>Prefix for lifecycle log lines (typically the concrete factory type name).</summary>
    protected abstract string FactoryLogPrefix
    {
        get;
    }

    /// <summary>Default HTTP client timeout after host startup.</summary>
    protected virtual TimeSpan HttpClientTimeout => IntegrationTestHttpCancellation.DefaultRequestTimeout;

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        client.Timeout = HttpClientTimeout;
    }

    /// <inheritdoc />
    public virtual async Task InitializeAsync()
    {
        await EnsureServicesStartedAsync().ConfigureAwait(false);
    }

    /// <inheritdoc cref="IAsyncLifetime.DisposeAsync" />
    Task IAsyncLifetime.DisposeAsync()
    {
        return Task.CompletedTask;
    }

    /// <summary>
    ///     Returns a single in-flight host-start task per factory instance so concurrent callers do not race
    ///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> internals (CI #2168).
    /// </summary>
    internal Task<IServiceProvider> EnsureServicesStartedAsync()
    {
        return _hostLifecycle.EnsureServicesStartedAsync(FactoryLogPrefix, StartServicesCoreAsync);
    }

    /// <summary>
    ///     Ensures the host is started (including TestServer client cache priming), then returns an
    ///     <see cref="HttpClient" />.
    /// </summary>
    internal async Task<HttpClient> CreateBoundedClientAsync()
    {
        await PrepareForClientCreationAsync().ConfigureAwait(false);
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
        return _hostLifecycle.DisposeHostAsync(FactoryLogPrefix, DisposeWebApplicationFactoryCoreAsync);
    }

    /// <summary>Disposes the underlying <see cref="WebApplicationFactory{TEntryPoint}" /> host.</summary>
    protected ValueTask DisposeWebApplicationFactoryCoreAsync()
    {
        return base.DisposeAsync();
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _storageProviderEnvironment.Dispose();

        base.Dispose(disposing);
    }

    /// <summary>Hook for subclasses to repin env/catalog immediately before client creation (greenfield SQL).</summary>
    protected virtual Task PrepareForClientCreationAsync()
    {
        return Task.CompletedTask;
    }

    /// <summary>Hook immediately before <see cref="IntegrationTestStorageProviderEnvironment.Apply" /> during startup.</summary>
    protected virtual void OnPrepareHostStartup()
    {
    }

    /// <summary>Hook after <see cref="Services" /> and the first <see cref="CreateClient" /> complete.</summary>
    protected virtual Task OnAfterHostStartedAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    /// <summary>
    ///     Wraps host startup work (default: no outer budget). Greenfield SQL factories override to apply bootstrap
    ///     timeout and readiness probes.
    /// </summary>
    protected virtual Task RunUnderHostStartupGateAsync(Func<CancellationToken, Task> startupWork)
    {
        ArgumentNullException.ThrowIfNull(startupWork);

        return startupWork(CancellationToken.None);
    }

    private Task<IServiceProvider> StartServicesCoreAsync()
    {
        return IntegrationTestStorageProviderHostGate.RunExclusiveAsync(StartServicesCoreUnderGateAsync);
    }

    private async Task<IServiceProvider> StartServicesCoreUnderGateAsync()
    {
        IServiceProvider? resolvedServices = null;

        await RunUnderHostStartupGateAsync(async cancellationToken =>
        {
            OnPrepareHostStartup();
            _storageProviderEnvironment.Apply();

            Console.Error.WriteLine(
                $"[{FactoryLogPrefix}] Host startup beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            resolvedServices = await IntegrationTestHostStartup.EnsureStartedAsync(() =>
            {
                IServiceProvider services = Services;
                _ = CreateClient();

                Console.Error.WriteLine(
                    $"[{FactoryLogPrefix}] Services resolved + CreateClient complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");

                return services;
            }).ConfigureAwait(false);

            await OnAfterHostStartedAsync(resolvedServices, cancellationToken).ConfigureAwait(false);
        }).ConfigureAwait(false);

        return resolvedServices
            ?? throw new InvalidOperationException($"{FactoryLogPrefix} host startup did not resolve services.");
    }
}
