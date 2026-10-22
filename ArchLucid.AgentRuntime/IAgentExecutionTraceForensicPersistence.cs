using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Persists full prompt/response text for agent execution traces (blob storage with SQL inline fallback).
/// </summary>
public interface IAgentExecutionTraceForensicPersistence
{
    /// <summary>
    ///     Writes full system/user prompts and raw response to blob storage, falling back to inline SQL columns on failure.
    /// </summary>
    Task PersistFullPromptsAsync(
        string traceId,
        string runId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        CancellationToken cancellationToken = default);
}
