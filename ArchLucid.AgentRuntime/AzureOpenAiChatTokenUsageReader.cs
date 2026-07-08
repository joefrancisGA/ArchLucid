using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

/// <summary>Reads Azure OpenAI chat usage fields used for TB-681 cached-input telemetry.</summary>
internal static class AzureOpenAiChatTokenUsageReader
{
    internal static int ReadCachedInputTokens(ChatTokenUsage usage) => usage.InputTokenDetails?.CachedTokenCount ?? 0;
}
