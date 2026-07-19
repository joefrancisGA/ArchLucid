namespace ArchLucid.AgentRuntime.Batch;

/// <summary>Ambient switch for routing <see cref="IAgentCompletionClient" /> calls through the Batch API on offline paths.</summary>
public interface ILlmBatchRoutingContext
{
    bool UseBatchPath
    {
        get;
    }
}
