namespace ArchLucid.Api.Tests;

/// <summary>
///     Serializes <see cref="IntegrationTestStorageProviderEnvironment.Apply" /> + host startup so parallel
///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> instances do not race on
///     process-wide <c>ArchLucid__StorageProvider</c> (env wins over in-memory factory config in <see cref="Program" />).
///     CI #2269: AlertLifecycle InMemory retrieval smoke hung on SQL-backed tenant lookups when a Sql factory overwrote env mid-boot.
/// </summary>
internal static class IntegrationTestStorageProviderHostGate
{
    /// <summary>
    ///     Bound wait for the process-wide storage-provider gate so a wedged greenfield host boot cannot block every
    ///     later SQL integration test until the chunk watchdog fires (CI shard 3/6 analysis, run #28095984745).
    /// </summary>
    internal static readonly TimeSpan GateWaitTimeout = TimeSpan.FromMinutes(5);

    private static readonly SemaphoreSlim Gate = new(1, 1);

    internal static async Task<T> RunExclusiveAsync<T>(Func<Task<T>> operation)
    {
        ArgumentNullException.ThrowIfNull(operation);

        if (!await Gate.WaitAsync(GateWaitTimeout).ConfigureAwait(false))
        {
            throw new TimeoutException(
                "Timed out waiting for "
                + nameof(IntegrationTestStorageProviderHostGate)
                + " after "
                + GateWaitTimeout
                + ". Another integration host may be wedged on storage-provider env or SQL boot.");
        }

        try
        {
            return await operation().ConfigureAwait(false);
        }
        finally
        {
            Gate.Release();
        }
    }
}
