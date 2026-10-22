using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Content-addresses the admitted architecture artifact (κ when present, else intake request body).
/// </summary>
public static class ArchitectureVersionContentFingerprint
{
    /// <summary>
    ///     SHA-256 over canonical request JSON (intake provenance; stored separately on version rows).
    /// </summary>
    public static byte[] ComputeIntakeRequestHash(ArchitectureRequest request)
    {
        return ArchitectureRunIdempotencyHashing.FingerprintRequest(request);
    }

    /// <summary>
    ///     SHA-256 over admitted architecture content: κ fingerprint when available, otherwise request hash.
    /// </summary>
    public static byte[] ComputeArtifactHash(ArchitectureRequest request, ArchitectureKnowledgeModel? knowledgeModel)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (knowledgeModel is not null)
        {
            string modelFingerprint = GraphSnapshotCanonicalFingerprint.ComputeReviewCacheKnowledgeModelFingerprint(
                knowledgeModel);

            if (!string.IsNullOrEmpty(modelFingerprint))
            {
                return SHA256.HashData(Encoding.UTF8.GetBytes(modelFingerprint));
            }
        }

        return ComputeIntakeRequestHash(request);
    }
}
