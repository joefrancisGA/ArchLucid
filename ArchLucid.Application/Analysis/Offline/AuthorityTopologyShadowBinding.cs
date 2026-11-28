namespace ArchLucid.Application.Analysis;

/// <summary>Exact read-only binding, not a lease or authorization to reuse.</summary>
internal sealed record AuthorityTopologyShadowBinding(
    Guid RunId, Guid ContextId, Guid GraphId, string PolicyPin, string EvidencePin, string HeaderWitness,
    string ResolvedPolicyIdsWitness, string ResolvedEvidenceWitness,
    string ContextVersion, long ContextFence, int ContextAttempts,
    string GraphVersion, long GraphFence, int GraphAttempts);
