namespace ArchLucid.Core.InfraEvidence;

internal static class ProvenanceKindRules
{
    /// <summary>LLM-inferred hops cannot be treated as confirmed observations.</summary>
    internal static bool ForbidsConfirmedConfidence(ProvenanceKind kind)
        => kind == ProvenanceKind.AiInference;
}
