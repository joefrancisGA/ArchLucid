namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Defines the bounded retry behavior for the authority-driven commit pipeline.
///     The pipeline is retried as a whole because a transient failure may occur at
///     any persistence point and a concurrent commit needs manifest reconciliation.
/// </summary>
public static class CommitRunTransientRetryPolicy
{
    public const int MaxAttempts = 12;
    public const int ManifestReconcilePollAttempts = 8;

    /// <summary>
    ///     Hard wall-clock ceiling for retries. This prevents a contended SQL resource
    ///     from making one commit request consume several default command timeouts.
    /// </summary>
    public static readonly TimeSpan RetryBudget = TimeSpan.FromSeconds(20);

    public static bool IsExhausted(int attempt, TimeSpan elapsed) =>
        attempt >= MaxAttempts || elapsed >= RetryBudget;

    public static TimeSpan RetryDelay(int attempt) =>
        TimeSpan.FromMilliseconds(150 * attempt);

    public static TimeSpan ManifestReconcilePollDelay(int poll) =>
        TimeSpan.FromMilliseconds(150 * poll);
}
