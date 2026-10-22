using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>AS-074 fallback when the premium LLM judge is disabled or not yet wired.</summary>
public sealed class NoOpFindingSemanticSupportBandLlmJudge : IFindingSemanticSupportBandLlmJudge
{
    public static NoOpFindingSemanticSupportBandLlmJudge Instance { get; } = new();

    public FindingSemanticSupportBand? TryScore(
        Finding finding,
        string findingMessage,
        IReadOnlyList<string> citationExcerpts,
        FindingSemanticSupportBandOptions options) =>
        null;
}
