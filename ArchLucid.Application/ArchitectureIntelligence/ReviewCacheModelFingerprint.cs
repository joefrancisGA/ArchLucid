using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     κ fingerprint for review-cache partitioning when a caller supplies an existing run id.
/// </summary>
public static class ReviewCacheModelFingerprint
{
    public static string Compute(ArchitectureKnowledgeModel? knowledgeModel)
    {
        return GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel);
    }
}
