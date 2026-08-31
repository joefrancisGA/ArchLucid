namespace ArchLucid.AgentRuntime;

/// <summary>Non-fatal signal that an Azure OpenAI completion hit the configured output token cap.</summary>
public sealed record LlmCompletionOutputTruncationEvent(
    string DeploymentName,
    int MaxOutputTokens,
    int OutputTokenCount,
    int ReasoningTokenCount);
