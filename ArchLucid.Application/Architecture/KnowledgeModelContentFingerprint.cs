using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Wave-10 suggestion 95: content-addressed κ fingerprint pinned on run headers at create.
/// </summary>
public static class KnowledgeModelContentFingerprint
{
    public static byte[]? TryComputeContentHashSha256(ArchitectureKnowledgeModel? knowledgeModel)
    {
        if (knowledgeModel is null)
            return null;

        string fingerprint = GraphSnapshotCanonicalFingerprint.ComputeReviewCacheKnowledgeModelFingerprint(
            knowledgeModel);

        if (string.IsNullOrEmpty(fingerprint))
            return null;

        return SHA256.HashData(Encoding.UTF8.GetBytes(fingerprint));
    }
}
