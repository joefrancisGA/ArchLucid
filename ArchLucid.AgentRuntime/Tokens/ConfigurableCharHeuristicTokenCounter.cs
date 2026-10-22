using ArchLucid.Core.Agents;
using ArchLucid.Retrieval.Chunking;

namespace ArchLucid.AgentRuntime.Tokens;

/// <summary>Character-heuristic token estimator with configurable chars-per-token (TB-2107).</summary>
public sealed class ConfigurableCharHeuristicTokenCounter(int charsPerToken) : ITokenCounter
{
    private readonly int _charsPerToken = charsPerToken > 0
        ? charsPerToken
        : TokenAwareContextBudget.DefaultCharsPerTokenEstimate;

    public int CountTokens(string text) =>
        TokenAwareContextBudget.EstimateTokenCount(text ?? string.Empty, _charsPerToken);
}
