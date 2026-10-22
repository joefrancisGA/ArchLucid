using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-058: merge heuristic scorer output with optional Lane B async semantic scores for Working read paths.
/// </summary>
public static class FindingSemanticSupportBandComposer
{
    public const string AsyncMayLagHonestyCopy =
        "Semantic support is async and may lag the sealed review. Lane B scores are not a commit gate (TB-1228).";

    public static FindingSemanticSupportBand ComposeForWorking(
        FindingSemanticSupportBand heuristicBand,
        AgentOutputSemanticScore? asyncSemanticScore)
    {
        if (heuristicBand == FindingSemanticSupportBand.NotScored)
            return FindingSemanticSupportBand.NotScored;

        FindingSemanticSupportBand? asyncBand =
            FindingSemanticSupportBandAsyncLaneBReader.TryReadFromSemanticScore(asyncSemanticScore);

        if (asyncBand is null)
            return FindingSemanticSupportBand.Unchecked;

        return asyncBand.Value;
    }

    public static FindingSemanticSupportBand ComposeForWorking(
        FindingSemanticSupportBand heuristicBand,
        string? agentExecutionTraceId,
        IReadOnlyDictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId)
    {
        AgentOutputSemanticScore? semanticScore =
            FindingSemanticSupportBandAsyncLaneBReader.TryResolveSemanticScoreForTrace(
                agentExecutionTraceId,
                semanticScoresByTraceId);

        return ComposeForWorking(heuristicBand, semanticScore);
    }
}
