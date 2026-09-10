using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Optional Premium-tier LLM pass for semantic support band scoring (AS-074). Default registration is no-op.
/// </summary>
public interface IFindingSemanticSupportBandLlmJudge
{
    /// <summary>
    ///     When enabled, attempts an LLM score for the finding claim vs citation excerpts.
    ///     Returns null to defer to the deterministic heuristic scorer (AS-057).
    /// </summary>
    FindingSemanticSupportBand? TryScore(
        Finding finding,
        string findingMessage,
        IReadOnlyList<string> citationExcerpts,
        FindingSemanticSupportBandOptions options);
}
