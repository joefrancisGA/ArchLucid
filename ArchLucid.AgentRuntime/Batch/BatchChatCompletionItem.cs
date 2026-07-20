namespace ArchLucid.AgentRuntime.Batch;

/// <summary>One chat completion request line in an Azure OpenAI Batch API job.</summary>
public sealed class BatchChatCompletionItem
{
    public BatchChatCompletionItem(string customId, string systemPrompt, string userPrompt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(customId);
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentException.ThrowIfNullOrWhiteSpace(userPrompt);

        CustomId = customId;
        SystemPrompt = systemPrompt;
        UserPrompt = userPrompt;
    }

    public string CustomId
    {
        get;
    }

    public string SystemPrompt
    {
        get;
    }

    public string UserPrompt
    {
        get;
    }

    public int? MaxTokens
    {
        get;
        init;
    }

    public float? Temperature
    {
        get;
        init;
    }
}
