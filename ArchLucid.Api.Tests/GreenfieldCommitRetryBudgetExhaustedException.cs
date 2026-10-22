namespace ArchLucid.Api.Tests;

/// <summary>
///     Thrown when greenfield SQL commit retries exceed the wall-clock budget on a loaded CI shard (CI #2377).
///     Callers should treat like <see cref="WarmupTimedOutException" /> and skip via
///     <see cref="GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload" />.
/// </summary>
internal sealed class GreenfieldCommitRetryBudgetExhaustedException : InvalidOperationException
{
    public GreenfieldCommitRetryBudgetExhaustedException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
