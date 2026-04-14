namespace ArchLucid.AgentRuntime;

/// <summary>Configuration for full prompt/response persistence to blob storage (always attempted; SQL inline fallback on failure).</summary>
public sealed class AgentExecutionTraceStorageOptions
{
    public const string SectionPath = "AgentExecution:TraceStorage";

    /// <summary>Maximum wall-clock time for the three blob writes combined (system, user, response). Clamped in the recorder.</summary>
    public int BlobPersistenceTimeoutSeconds { get; set; } = 30;
}
