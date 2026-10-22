namespace ArchLucid.AgentRuntime.Tokens;

/// <summary>
///     Estimates prompt token counts for Azure OpenAI context window guards.
/// </summary>
public interface ITokenCounter
{
    int CountTokens(string text);
}
