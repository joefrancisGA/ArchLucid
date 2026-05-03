namespace ArchLucid.AgentRuntime;

/// <summary>
///     Thrown when an agent run exceeds the configured maximum tokens or cost.
/// </summary>
public sealed class CostLimitExceededException : Exception
{
    public CostLimitExceededException(string message) : base(message)
    {
    }

    public CostLimitExceededException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
