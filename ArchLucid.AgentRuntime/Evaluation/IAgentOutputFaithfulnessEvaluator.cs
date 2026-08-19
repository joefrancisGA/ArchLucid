using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>LLM judge comparing agent output JSON against supplied evidence chunks.</summary>
public interface IAgentOutputFaithfulnessEvaluator
{
    /// <summary>
    ///     Returns a 0..1 faithfulness score when enabled and successful; otherwise <see langword="null" />.
    /// </summary>
    Task<double?> TryEvaluateAsync(
        string traceId,
        string parsedResultJson,
        AgentEvidencePackage evidencePackage,
        CancellationToken cancellationToken);
}
