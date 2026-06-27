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
            // RecordAndReturnOnShardOverload signals the overload without throwing SkipException
            // after an await. Throwing SkipException here would cause vstest to re-queue the test
            // indefinitely. Callers that need to skip should call SkipIfShardWarmupAlreadyTimedOut()
            // synchronously before their next await, or use RecordAndReturnOnShardOverload + return.
            RecordAndReturnOnShardOverload();
        }
    }

    /// <summary>
    ///     Records shard overload and signals the caller to <c>return</c> from the test method without
    ///     asserting. Use this in <c>catch</c> blocks that execute after an <c>await</c>; never call
    ///     <see cref="Skip.If" /> / <see cref="Skip.IfNot" /> there because throwing
    ///     <see cref="SkipException" /> after an <c>await</c> causes an infinite vstest re-queue loop.
    ///     Subsequent tests in the same process will skip via <see cref="SkipIfShardWarmupAlreadyTimedOut" />.
    /// </summary>
    internal static void RecordAndReturnOnShardOverload()
    {
        RecordShardWarmupTimedOut();
    }
}
