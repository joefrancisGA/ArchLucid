using System.Threading;

using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared greenfield SQL primer warmup and circuit breaker for integration tests.
/// </summary>
internal sealed class GreenfieldSqlIntegrationWarmup
{
    private int _shardWarmupTimedOut;

    internal static GreenfieldSqlIntegrationWarmup Shared { get; } = new();

    internal static string ShardOverloadSkipReason =>
        "Greenfield SQL warmup timed out on this shard (GreenfieldSqlHostBootstrapBudget: "
        + ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlHostBootstrapBudget
        + "). The CI shard may be overloaded.";

    /// <summary>
    ///     Set when a bootstrap budget expires in the test host process so later tests can skip
    ///     before creating another ephemeral catalog or booting another API host (CI shard 3/6 hang, run #2234).
    /// </summary>
    internal bool ShardWarmupTimedOut => Volatile.Read(ref _shardWarmupTimedOut) != 0;

    // Check at a test boundary before awaiting SQL work. A timeout during the current test must
    // fail as an ordinary exception because a late SkipException can re-queue the test in VSTest.
    internal void SkipIfShardWarmupAlreadyTimedOut()
    {
        Skip.If(ShardWarmupTimedOut, ShardOverloadSkipReason);
    }

    internal async Task RunUnderBudgetAsync(
        Func<CancellationToken, Task> warmup,
        TimeSpan budget,
        string entryPointName,
        CancellationToken cancellationToken)
    {
        using CancellationTokenSource bootstrap = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        bootstrap.CancelAfter(budget);
        CancellationToken token = bootstrap.Token;

        try
        {
            await warmup(token);
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested && token.IsCancellationRequested)
        {
            Interlocked.Exchange(ref _shardWarmupTimedOut, 1);
            throw new WarmupTimedOutException(
                $"Greenfield SQL host warmup exceeded its bootstrap budget ({budget}). See {entryPointName}.",
                ex);
        }
    }

    internal static Task WarmArchitectureRequestHostAsync(
        HttpClient client,
        bool includePostCreateRunWarmup = true,
        CancellationToken cancellationToken = default)
    {
        return ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
            client,
            cancellationToken,
            includePostCreateRunWarmup);
    }
}
