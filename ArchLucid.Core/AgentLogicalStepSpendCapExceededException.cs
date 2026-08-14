namespace ArchLucid.Core;

/// <summary>
///     Raised when a single agent task exceeds the configured billed completion attempt cap (TB-941).
/// </summary>
public sealed class AgentLogicalStepSpendCapExceededException : Exception
{
    public AgentLogicalStepSpendCapExceededException(string runId, string taskId, int maxAttempts, int observedAttempts)
        : base(
            $"Run '{runId}' task '{taskId}' exceeded the logical agent step spend cap "
            + $"({observedAttempts} billed attempts; cap {maxAttempts}).")
    {
        RunId = runId;
        TaskId = taskId;
        MaxAttempts = maxAttempts;
        ObservedAttempts = observedAttempts;
    }

    public string RunId
    {
        get;
    }

    public string TaskId
    {
        get;
    }

    public int MaxAttempts
    {
        get;
    }

    public int ObservedAttempts
    {
        get;
    }
}
