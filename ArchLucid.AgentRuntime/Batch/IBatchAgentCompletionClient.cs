namespace ArchLucid.AgentRuntime.Batch;

/// <summary>
///     Submits Azure OpenAI Batch API jobs for non-interactive chat completions and polls until results are available.
/// </summary>
public interface IBatchAgentCompletionClient
{
    /// <summary>Runs one or more chat completions through the Batch API and returns aligned results.</summary>
    Task<(IReadOnlyList<BatchChatCompletionResult> Results, BatchAgentCompletionRunSummary Summary)> RunChatCompletionsBatchAsync(
        IReadOnlyList<BatchChatCompletionItem> requests,
        CancellationToken cancellationToken);
}
