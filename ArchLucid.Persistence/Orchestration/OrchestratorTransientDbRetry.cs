using Polly;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>
///     Retries authority orchestrator state-persist and commit operations on transient SQL failures
///     (deadlock, timeout, etc.) without altering the state machine.
/// </summary>
internal static class OrchestratorTransientDbRetry
{
    /// <summary>Three retries with 2s base exponential backoff (2s, 4s, 8s).</summary>
    private static readonly ResiliencePipeline Pipeline =
        SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(maxRetryAttempts: 3, baseDelay: TimeSpan.FromSeconds(2));

    public static async Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
    {
        await Pipeline.ExecuteAsync(
            async ct =>
            {
                await action(ct).ConfigureAwait(false);
            },
            cancellationToken).ConfigureAwait(false);
    }

    public static async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken) =>
        await Pipeline.ExecuteAsync(async ct => await action(ct).ConfigureAwait(false), cancellationToken).ConfigureAwait(false);
}
