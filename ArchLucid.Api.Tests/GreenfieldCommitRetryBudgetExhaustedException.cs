namespace ArchLucid.Api.Tests;

/// <summary>
///     Reports a greenfield SQL commit retry exhaustion with the last observed run diagnostics.
///     Unlike a host bootstrap timeout, this is specific to the run and does not trip the shard circuit breaker.
/// </summary>
internal sealed class GreenfieldCommitRetryBudgetExhaustedException : InvalidOperationException
{
    public GreenfieldCommitRetryBudgetExhaustedException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
