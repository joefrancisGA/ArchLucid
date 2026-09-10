using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-058: consume existing Lane B async semantic scores (RAG-V1-005 / agent evaluation) when present.
///     Lane B row shape: <see cref="AgentOutputSemanticScore.FindingCitationCoverageRatio" /> or
///     <see cref="AgentOutputSemanticScore.AgentResultFaithfulnessSupportRatio" /> keyed by trace id.
///     Missing row → compose returns Unchecked (not Supported). Does not enqueue jobs or block execute.
/// </summary>
public static class FindingSemanticSupportBandAsyncLaneBReader
{
    private const double SupportedRatioFloor = 0.7;
    private const double UnsupportedRatioCeiling = 0.35;

    public static FindingSemanticSupportBand? TryReadFromSemanticScore(AgentOutputSemanticScore? semanticScore)
    {
        if (semanticScore is null)
            return null;

        double? ratio = semanticScore.FindingCitationCoverageRatio
            ?? semanticScore.AgentResultFaithfulnessSupportRatio;

        if (ratio is not double parsedRatio)
            return null;

        if (parsedRatio >= SupportedRatioFloor - 1e-9)
            return FindingSemanticSupportBand.Supported;

        if (parsedRatio < UnsupportedRatioCeiling)
            return FindingSemanticSupportBand.Unsupported;

        return FindingSemanticSupportBand.Unchecked;
    }

    public static AgentOutputSemanticScore? TryResolveSemanticScoreForTrace(
        string? agentExecutionTraceId,
        IReadOnlyDictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId)
    {
        if (string.IsNullOrWhiteSpace(agentExecutionTraceId))
            return null;

        return semanticScoresByTraceId.TryGetValue(agentExecutionTraceId, out AgentOutputSemanticScore? semanticScore)
            ? semanticScore
            : null;
    }
}
