using ArchLucid.Retrieval.Chunking;

namespace ArchLucid.AgentRuntime.Tokens;

/// <summary>
///     Character-heuristic token estimator (no Tiktoken dependency).
/// </summary>
public sealed class CharHeuristicTokenCounter : ITokenCounter
{
    public int CountTokens(string text) =>
        TokenAwareContextBudget.EstimateTokenCount(text ?? string.Empty);
}
