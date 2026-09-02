using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Wave-6 suggestion 56: re-verify pinned architecture version content hash κ at commit.
/// </summary>
public static class ArchitectureVersionContentFingerprintVerifier
{
    public static void EnsurePinnedVersionMatchesRequestOrThrow(
        ArchitectureVersionRecord version,
        ArchitectureRequest request,
        ArchitectureKnowledgeModel? knowledgeModel)
    {
        ArgumentNullException.ThrowIfNull(version);
        ArgumentNullException.ThrowIfNull(request);

        byte[] recomputedArtifactHash =
            ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, knowledgeModel);

        if (!recomputedArtifactHash.AsSpan().SequenceEqual(version.ContentHashSha256))
        {
            throw new ConflictException(
                "Commit blocked: admitted architecture content no longer matches the pinned ArchitectureVersionId (κ drift).");
        }
    }
}
