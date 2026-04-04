namespace ArchiForge.AgentRuntime;

/// <summary>Thrown when a tenant exceeds configured LLM token quota for the current sliding window.</summary>
public sealed class LlmTokenQuotaExceededException : InvalidOperationException
{
    public LlmTokenQuotaExceededException(string message)
        : base(message)
    {
    }
}
