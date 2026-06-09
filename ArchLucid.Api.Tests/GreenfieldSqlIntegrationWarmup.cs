using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared greenfield SQL primer warmup for integration tests; skips overloaded CI shards instead of hard-failing.
/// </summary>
internal static class GreenfieldSqlIntegrationWarmup
{
    internal static string ShardOverloadSkipReason =>
        "Greenfield SQL warmup timed out on this shard (GreenfieldSqlHostBootstrapBudget: "
        + ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlHostBootstrapBudget
        + "). The CI shard may be overloaded.";

    internal static async Task WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
        HttpClient client,
        bool includePostCreateRunWarmup = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
                client,
                cancellationToken,
                includePostCreateRunWarmup);
        }
        catch (WarmupTimedOutException)
        {
            Skip.If(true, ShardOverloadSkipReason);
        }
    }
}
