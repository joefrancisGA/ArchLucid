namespace ArchLucid.Api.Tests;

/// <summary>
///     Forces <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> host
///     startup (first access to <c>Services</c>) under a bounded timeout so a stuck hosted-service
///     <c>StartAsync</c> fails the test quickly instead of consuming the full CI blame-hang budget.
/// </summary>
internal static class IntegrationTestHostStartup
{
    internal static readonly TimeSpan DefaultStartupTimeout = TimeSpan.FromSeconds(120);

    /// <summary>
    ///     Returns the started host's <see cref="IServiceProvider" />, or throws
    ///     <see cref="TimeoutException" /> if startup does not complete within <paramref name="timeout" />.
    /// </summary>
    internal static async Task<IServiceProvider> EnsureStartedAsync(
        Func<IServiceProvider> accessServices,
        TimeSpan? timeout = null)
    {
        ArgumentNullException.ThrowIfNull(accessServices);

        // First access to factory.Services builds and starts the host synchronously; run it off the
        // test thread so we can bound it with WaitAsync (host start has no native CancellationToken seam).
        Task<IServiceProvider> startTask = Task.Run(accessServices);

        return await startTask.WaitAsync(timeout ?? DefaultStartupTimeout);
    }
}
