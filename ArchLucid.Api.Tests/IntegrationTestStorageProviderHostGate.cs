namespace ArchLucid.Api.Tests;

/// <summary>
///     Serializes <see cref="IntegrationTestStorageProviderEnvironment.Apply" /> + host startup so parallel
///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> instances do not race on
///     process-wide <c>ArchLucid__StorageProvider</c> (env wins over in-memory factory config in <see cref="Program" />).
///     CI #2269: AlertLifecycle InMemory retrieval smoke hung on SQL-backed tenant lookups when a Sql factory overwrote env mid-boot.
/// </summary>
internal static class IntegrationTestStorageProviderHostGate
{
    private static readonly SemaphoreSlim Gate = new(1, 1);

    internal static async Task<T> RunExclusiveAsync<T>(Func<Task<T>> operation)
    {
        ArgumentNullException.ThrowIfNull(operation);

        await Gate.WaitAsync().ConfigureAwait(false);

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
