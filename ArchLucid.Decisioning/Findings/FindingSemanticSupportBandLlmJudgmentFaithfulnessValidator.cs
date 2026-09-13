using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     ADR 0099: the LLM may not invent Supported from disjoint citations, and may not demote an exact-quote
///     Supported heuristic to Unsupported (TB-1228 false-reject).
/// </summary>
public static class FindingSemanticSupportBandLlmJudgmentFaithfulnessValidator
{
    public static bool IsAcceptable(
        FindingSemanticSupportBand llmBand,
        FindingSemanticSupportBand heuristicBand)
    {
        if (llmBand == FindingSemanticSupportBand.Supported
            && heuristicBand == FindingSemanticSupportBand.Unsupported)
        {
            return false;
        }

        if (llmBand == FindingSemanticSupportBand.Unsupported
            && heuristicBand == FindingSemanticSupportBand.Supported)
        {
            return false;
        }

        return true;
    }
}
