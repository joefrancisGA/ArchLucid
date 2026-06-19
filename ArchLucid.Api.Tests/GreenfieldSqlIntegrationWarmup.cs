using System.Threading;

using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared greenfield SQL primer warmup for integration tests; skips overloaded CI shards instead of hard-failing.
/// </summary>
internal static class GreenfieldSqlIntegrationWarmup
{
    private static int _shardWarmupTimedOut;

    internal static string ShardOverloadSkipReason =>
        "Greenfield SQL warmup timed out on this shard (GreenfieldSqlHostBootstrapBudget: "
        + ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlHostBootstrapBudget
        + "). The CI shard may be overloaded.";

    /// <summary>
    ///     Set after the first <see cref="WarmupTimedOutException" /> in the test host process so later tests skip
    ///     before creating another ephemeral catalog or booting another API host (CI shard 3/6 hang, run #2234).
    /// </summary>
    internal static bool ShardWarmupTimedOut =>
        Interlocked.CompareExchange(ref _shardWarmupTimedOut, 0, 0) != 0;

    internal static void SkipIfShardWarmupAlreadyTimedOut()
    {
        Skip.If(ShardWarmupTimedOut, ShardOverloadSkipReason);
    }

    internal static void RecordShardWarmupTimedOut()
    {
        Interlocked.Exchange(ref _shardWarmupTimedOut, 1);
    }

    internal static async Task WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
        HttpClient client,
        bool includePostCreateRunWarmup = true,
        CancellationToken cancellationToken = default)
    {
        SkipIfShardWarmupAlreadyTimedOut();

        try
        {
            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
                client,
                cancellationToken,
                includePostCreateRunWarmup);
        }
        catch (WarmupTimedOutException)
        {
            SkipShardOverload();
        }
    }

    /// <summary>
    ///     Unconditional skip for overloaded CI shards. Centralised so test-level catch blocks do not depend on
    ///     <c>Skip.If(true, …)</c> predicate quirks when factory disposal throws a secondary exception.
    /// </summary>
    internal static void SkipShardOverload()
    {
        RecordShardWarmupTimedOut();
        Skip.IfNot(false, ShardOverloadSkipReason);
    }
}
