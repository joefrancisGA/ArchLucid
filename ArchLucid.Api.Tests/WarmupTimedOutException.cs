namespace ArchLucid.Api.Tests;

/// <summary>
///     Thrown when <see cref="ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync"/>
///     exhausts <see cref="ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlHostBootstrapBudget"/> before DbUp,
///     readiness, and optional create-run warmup complete on a reachable SQL shard.
/// </summary>
internal sealed class WarmupTimedOutException : InvalidOperationException
{
    public WarmupTimedOutException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
