namespace ArchLucid.AgentRuntime;

/// <summary>Configuration for optional full prompt/response persistence to blob storage.</summary>
public sealed class AgentExecutionTraceStorageOptions
{
    public const string SectionPath = "AgentExecution:TraceStorage";

    /// <summary>When true, full (unsanitized) prompts and responses are uploaded after trace insert (awaited before <see cref="IAgentExecutionTraceRecorder.RecordAsync"/> returns).</summary>
    public bool PersistFullPrompts { get; set; } = true;

    /// <summary>Maximum wall-clock time for the three blob writes combined (system, user, response). Clamped in the recorder.</summary>
    public int BlobPersistenceTimeoutSeconds { get; set; } = 30;
}
