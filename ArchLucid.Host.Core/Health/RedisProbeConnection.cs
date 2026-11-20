namespace ArchLucid.Host.Core.Health;

/// <summary>Owns the result of a Redis probe connection attempt until the probe acquires it.</summary>
public static class RedisProbeConnection
{
    public static async Task<TConnection> ConnectAsync<TConnection>(
        Func<Task<TConnection>> connect,
        CancellationToken cancellationToken)
        where TConnection : IDisposable
    {
        ArgumentNullException.ThrowIfNull(connect);
        cancellationToken.ThrowIfCancellationRequested();

        Task<TConnection> pending = connect();

        try
        {
            return await pending.WaitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Cancellation stops the wait, so the pending connection still needs an owner.
            _ = DisposeAbandonedConnectionAsync(pending);
            throw;
        }
    }

    private static async Task DisposeAbandonedConnectionAsync<TConnection>(Task<TConnection> pending)
        where TConnection : IDisposable
    {
        try
        {
            using TConnection connection = await pending.ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Observe late connection or disposal failures after the probe has already ended.
        }
    }
}
