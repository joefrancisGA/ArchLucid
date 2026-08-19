namespace ArchLucid.Contracts.Agents;

/// <summary>Optional embedding alignment between AgentResult claims/findings and flattened evidence (additive telemetry).</summary>
public interface IAgentResultEmbeddingFaithfulnessScorer
{
    Task<double?> TryComputeMeanCosineAsync(
        string parsedResultJson,
        AgentEvidencePackage evidencePackage,
        CancellationToken cancellationToken);
}
