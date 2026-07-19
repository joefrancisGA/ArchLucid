namespace ArchLucid.AgentRuntime.Batch;

/// <summary>One chat completion response line from a completed Azure OpenAI Batch API job.</summary>
public sealed class BatchChatCompletionResult
{
    public required string CustomId
    {
        get;
        init;
    }

    public required string AssistantText
    {
        get;
        init;
    }

    public int PromptTokens
    {
        get;
        init;
    }

    public int CompletionTokens
    {
        get;
        init;
    }
}
