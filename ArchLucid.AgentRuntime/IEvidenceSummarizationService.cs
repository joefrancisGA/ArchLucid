using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>Compresses oversized evidence text using the fast LLM tier before hard context truncation.</summary>
public interface IEvidenceSummarizationService
{
    /// <summary>
    ///     Returns a dense plain-text summary targeting <paramref name="targetMaxTokens" />.
    ///     Fail-open: returns <paramref name="evidenceText" /> when summarization is disabled or fails.
    /// </summary>
    Task<string> SummarizeAsync(
        string evidenceText,
        int targetMaxTokens,
        AgentType agentType,
        CancellationToken cancellationToken = default);
}
