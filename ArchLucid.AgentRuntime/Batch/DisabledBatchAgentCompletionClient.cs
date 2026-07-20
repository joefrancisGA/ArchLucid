namespace ArchLucid.AgentRuntime.Batch;

/// <summary>
///     Placeholder batch client for hosts where batch mode is off or API-key transport is unavailable.
///     Real batch work is only registered when <see cref="LlmBatchOptions.Enabled" /> is true at startup.
/// </summary>
public sealed class DisabledBatchAgentCompletionClient : IBatchAgentCompletionClient
{
    public static readonly DisabledBatchAgentCompletionClient Instance = new();

    private DisabledBatchAgentCompletionClient()
    {
    }

    /// <inheritdoc />
    public Task<(IReadOnlyList<BatchChatCompletionResult> Results, BatchAgentCompletionRunSummary Summary)>
        RunChatCompletionsBatchAsync(
            IReadOnlyList<BatchChatCompletionItem> requests,
            CancellationToken cancellationToken)
    {
        throw new InvalidOperationException(
            "Azure OpenAI Batch API is disabled or not configured for this host.");
    }
}
